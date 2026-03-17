#!/bin/bash

###############################################################################
# Database Backup Script for Chorus AI
# Backs up MySQL database to AWS S3 with encryption and verification
# 
# Usage: ./backup-database.sh
# 
# Environment Variables Required:
#   DB_HOST - MySQL host
#   DB_USER - MySQL user
#   DB_PASSWORD - MySQL password
#   DB_NAME - Database name (or leave empty for all databases)
#   AWS_ACCESS_KEY_ID - AWS access key
#   AWS_SECRET_ACCESS_KEY - AWS secret key
#   S3_BUCKET - S3 bucket name for backups
#   BACKUP_LOG - Log file path (optional)
###############################################################################

set -e

# Configuration
BACKUP_DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="chorus-ai-backup-${BACKUP_DATE}.sql.gz"
BACKUP_DIR="/tmp/backups"
S3_BUCKET="${S3_BUCKET:-chorus-ai-backups}"
BACKUP_LOG="${BACKUP_LOG:-/var/log/chorus-ai-backups.log}"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_LOG"
}

# Error handler
error_exit() {
  log "ERROR: $1"
  exit 1
}

# Verify environment variables
verify_env() {
  local required_vars=("DB_HOST" "DB_USER" "DB_PASSWORD" "S3_BUCKET")
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      error_exit "Missing required environment variable: $var"
    fi
  done
}

# Create backup
create_backup() {
  log "Starting database backup..."
  
  local mysqldump_opts=(
    "--host=$DB_HOST"
    "--user=$DB_USER"
    "--password=$DB_PASSWORD"
    "--single-transaction"
    "--quick"
    "--lock-tables=false"
    "--add-drop-database"
    "--add-drop-table"
  )
  
  if [ -n "$DB_NAME" ]; then
    mysqldump_opts+=("$DB_NAME")
  else
    mysqldump_opts+=("--all-databases")
  fi
  
  # Create backup file
  if mysqldump "${mysqldump_opts[@]}" | gzip > "$BACKUP_DIR/$BACKUP_FILE"; then
    log "Backup created successfully: $BACKUP_FILE"
    log "Backup size: $(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)"
  else
    error_exit "Failed to create database backup"
  fi
}

# Upload to S3
upload_to_s3() {
  log "Uploading backup to S3..."
  
  if aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" "s3://$S3_BUCKET/$BACKUP_FILE" \
    --sse AES256 \
    --storage-class STANDARD_IA \
    --region us-east-1; then
    log "Backup uploaded to S3: s3://$S3_BUCKET/$BACKUP_FILE"
  else
    error_exit "Failed to upload backup to S3"
  fi
}

# Verify backup integrity
verify_backup() {
  log "Verifying backup integrity..."
  
  if gunzip -t "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null; then
    log "Backup verification passed"
  else
    error_exit "Backup verification failed - file may be corrupted"
  fi
}

# Clean up old backups
cleanup_old_backups() {
  log "Cleaning up backups older than $RETENTION_DAYS days..."
  
  # Local cleanup
  find "$BACKUP_DIR" -name "chorus-ai-backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete
  log "Local backups cleaned up"
  
  # S3 cleanup
  aws s3 ls "s3://$S3_BUCKET/" | grep "chorus-ai-backup-" | while read -r line; do
    create_date=$(echo "$line" | awk '{print $1}')
    file_name=$(echo "$line" | awk '{print $4}')
    
    # Calculate days old
    file_timestamp=$(date -d "$create_date" +%s)
    current_timestamp=$(date +%s)
    days_old=$(( (current_timestamp - file_timestamp) / 86400 ))
    
    if [ "$days_old" -gt "$RETENTION_DAYS" ]; then
      aws s3 rm "s3://$S3_BUCKET/$file_name"
      log "Deleted old backup from S3: $file_name"
    fi
  done
}

# Clean up local backup file
cleanup_local() {
  rm -f "$BACKUP_DIR/$BACKUP_FILE"
  log "Local backup file cleaned up"
}

# Main execution
main() {
  log "=========================================="
  log "Chorus AI Database Backup Started"
  log "=========================================="
  
  verify_env
  create_backup
  verify_backup
  upload_to_s3
  cleanup_old_backups
  cleanup_local
  
  log "=========================================="
  log "Chorus AI Database Backup Completed Successfully"
  log "=========================================="
}

# Run main function
main
