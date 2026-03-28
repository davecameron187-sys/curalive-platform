# Chorus.AI Terraform Outputs
# Infrastructure Endpoints and Configuration

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_read_replica_endpoint" {
  description = "RDS read replica endpoint"
  value       = aws_db_instance.read_replica.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
  sensitive   = true
}

output "redis_port" {
  description = "Redis cluster port"
  value       = aws_elasticache_cluster.main.port
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "app_security_group_id" {
  description = "Application security group ID"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}

output "autoscaling_group_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.app.name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for application"
  value       = aws_cloudwatch_log_group.app.name
}

output "kms_key_id" {
  description = "KMS key ID for database encryption"
  value       = aws_kms_key.database.id
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.main.arn
}

output "terraform_state_bucket" {
  description = "S3 bucket for Terraform state"
  value       = "chorus-ai-terraform-state"
}

output "terraform_lock_table" {
  description = "DynamoDB table for Terraform locks"
  value       = "terraform-locks"
}
