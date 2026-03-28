# Chorus.AI Production Infrastructure
# Terraform Configuration for AWS Deployment
# Version: 1.0
# Last Updated: March 28, 2026

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "chorus-ai-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "chorus-ai"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# ============================================================================
# VPC & NETWORKING
# ============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "chorus-ai-vpc-${var.environment}"
  }
}

# Public Subnets (for ALB, NAT Gateway)
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "chorus-ai-public-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets (for app servers, database)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 2)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "chorus-ai-private-${count.index + 1}"
    Type = "Private"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "chorus-ai-igw"
  }
}

# NAT Gateway (for private subnet outbound traffic)
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name = "chorus-ai-nat-eip-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "chorus-ai-nat-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "chorus-ai-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables (one per NAT Gateway for redundancy)
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "chorus-ai-private-rt-${count.index + 1}"
  }
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

# ALB Security Group
resource "aws_security_group" "alb" {
  name        = "chorus-ai-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "chorus-ai-alb-sg"
  }
}

# App Server Security Group
resource "aws_security_group" "app" {
  name        = "chorus-ai-app-sg"
  description = "Security group for app servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "chorus-ai-app-sg"
  }
}

# Database Security Group
resource "aws_security_group" "database" {
  name        = "chorus-ai-database-sg"
  description = "Security group for RDS database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "chorus-ai-database-sg"
  }
}

# Redis Security Group
resource "aws_security_group" "redis" {
  name        = "chorus-ai-redis-sg"
  description = "Security group for Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "chorus-ai-redis-sg"
  }
}

# ============================================================================
# RDS DATABASE
# ============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "chorus-ai-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "chorus-ai-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "chorus-ai-db-${var.environment}"
  engine         = "mysql"
  engine_version = "8.0.35"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.database.arn

  db_name  = "chorus_ai"
  username = var.db_username
  password = random_password.db_password.result

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]

  multi_az               = true
  publicly_accessible    = false
  backup_retention_period = 30
  backup_window          = "02:00-03:00"
  maintenance_window     = "sun:03:00-sun:04:00"

  skip_final_snapshot       = false
  final_snapshot_identifier = "chorus-ai-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  tags = {
    Name = "chorus-ai-db"
  }
}

# Database read replica for scaling
resource "aws_db_instance" "read_replica" {
  identifier     = "chorus-ai-db-read-replica-${var.environment}"
  replicate_source_db = aws_db_instance.main.identifier
  instance_class = var.db_instance_class

  publicly_accessible = false
  skip_final_snapshot = true

  tags = {
    Name = "chorus-ai-db-read-replica"
  }
}

# ============================================================================
# REDIS CLUSTER
# ============================================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "chorus-ai-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "chorus-ai-redis-subnet-group"
  }
}

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "chorus-ai-redis-${var.environment}"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_nodes
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379

  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth_token.result

  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis_slow_log.name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  tags = {
    Name = "chorus-ai-redis"
  }
}

# ============================================================================
# APPLICATION LOAD BALANCER
# ============================================================================

resource "aws_lb" "main" {
  name               = "chorus-ai-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name = "chorus-ai-alb"
  }
}

resource "aws_lb_target_group" "app" {
  name        = "chorus-ai-tg-${var.environment}"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name = "chorus-ai-tg"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ============================================================================
# AUTO SCALING GROUP
# ============================================================================

resource "aws_launch_template" "app" {
  name_prefix   = "chorus-ai-lt-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = var.app_instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }

  security_groups = [aws_security_group.app.id]

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    database_url = "mysql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.endpoint}:3306/chorus_ai"
    redis_url    = "rediss://:${random_password.redis_auth_token.result}@${aws_elasticache_cluster.main.cache_nodes[0].address}:6379"
  }))

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "chorus-ai-app-${var.environment}"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "chorus-ai-asg-${var.environment}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "chorus-ai-app"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# CLOUDWATCH MONITORING
# ============================================================================

resource "aws_cloudwatch_log_group" "app" {
  name              = "/chorus-ai/app/${var.environment}"
  retention_in_days = 30

  tags = {
    Name = "chorus-ai-app-logs"
  }
}

resource "aws_cloudwatch_log_group" "redis_slow_log" {
  name              = "/chorus-ai/redis/slow-log"
  retention_in_days = 7

  tags = {
    Name = "chorus-ai-redis-slow-log"
  }
}

# ============================================================================
# KMS ENCRYPTION
# ============================================================================

resource "aws_kms_key" "database" {
  description             = "KMS key for Chorus.AI database encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = {
    Name = "chorus-ai-db-key"
  }
}

resource "aws_kms_alias" "database" {
  name          = "alias/chorus-ai-db"
  target_key_id = aws_kms_key.database.key_id
}

# ============================================================================
# SSL CERTIFICATE
# ============================================================================

resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "chorus-ai-cert"
  }
}

# ============================================================================
# RANDOM PASSWORDS
# ============================================================================

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "redis_auth_token" {
  length  = 32
  special = true
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ============================================================================
# IAM ROLES
# ============================================================================

resource "aws_iam_role" "app" {
  name = "chorus-ai-app-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "app" {
  name = "chorus-ai-app-policy"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.app.arn}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = "arn:aws:s3:::chorus-ai-*/*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "chorus-ai-app-profile"
  role = aws_iam_role.app.name
}
