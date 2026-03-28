# Chorus.AI Terraform Variables
# Production Configuration

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "chorusai.com"
}

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.large"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

# ============================================================================
# REDIS CONFIGURATION
# ============================================================================

variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_num_nodes" {
  description = "Number of Redis nodes"
  type        = number
  default     = 3
}

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================

variable "app_instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.large"
}

variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
  default     = 3
}

# ============================================================================
# TAGS
# ============================================================================

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project = "chorus-ai"
    Owner   = "platform-team"
  }
}
