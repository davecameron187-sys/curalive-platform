#!/bin/bash

###############################################################################
# Database Restore Script for Chorus AI
# Restores MySQL database from S3 backup
# 
# Usage: ./restore-database.sh [backup-file]
# 
# If backup-file is not provided, restores from latest backup
# 
# Environment Variables Required:
#   DB_HOST - MySQL host
#   DB_USER - MySQL user
#   DB_PASSWORD - MySQL password
#   S3_BUCKET - S3 bucket name
#   BACKUP_LOG - Log file path (optional)
###############################################################################

set -e

# Configuration
S3_BUCKET="${S3_BUCKET:-chorus-ai-backups}"
BACKUP_LOG="${BACKUP_LOG:-/var/log/chorus-ai-backups.log}"
BACKUP_DIR="/tmp/restore"
BACKUP_FILE="${1:-}"

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

# Get latest backup if not specified
get_backup_file() {
  if [ -z "$BACKUP_FILE" ]; then
    log "No backup file specified, fetching latest from S3..."
    BACKUP_FILE=$(aws s3 ls "s3://$S3_BUCKET/" | grep "chorus-ai-backup-" | sort | tail -n 1 | awk '{print $4}')
    
    if [ -z "$BACKUP_FILE" ]; then
      error_exit "No backups found in S3 bucket: $S3_BUCKET"
    fi
  fi
  
  log "Using backup file: $BACKUP_FILE"
}

# Create restore directory
create_restore_dir() {
  mkdir -p "$BACKUP_DIR"
}

# Download backup from S3
download_backup() {
  log "Downloading backup from S3..."
  
  if aws s3 cp "s3://$S3_BUCKET/$BACKUP_FILE" "$BACKUP_DIR/$BACKUP_FILE" --region us-east-1; then
    log "Backup downloaded successfully"
  else
    error_exit "Failed to download backup from S3"
  fi
}

# Verify backup before restore
verify_backup() {
  log "Verifying backup integrity..."
  
  if gunzip -t "$BACKUP_DIR/$BACKUP_FILE" 2>/dev/null; then
    log "✓ Backup integrity verified"
  else
    error_exit "✗ Backup verification failed - file is corrupted"
  fi
}

# Confirm restore
confirm_restore() {
  log "=========================================="
  log "WARNING: This will restore the database from backup"
  log "Backup File: $BACKUP_FILE"
  log "Database: $DB_HOST"
  log "=========================================="
  
  read -p "Are you sure you want to restore? (yes/no): " -r confirm
  
  if [[ ! $confirm =~ ^[Yy][Ee][Ss]$ ]]; then
    error_exit "Restore cancelled by user"
  fi
}

# Restore database
restore_database() {
  log "Starting database restore..."
  
  if gunzip -c "$BACKUP_DIR/$BACKUP_FILE" | mysql \
    --host="$DB_HOST" \
    --user="$DB_USER" \
    --password="$DB_PASSWORD" \
    --verbose; then
    log "Database restored successfully"
  else
    error_exit "Database restore failed"
  fi
}

# Verify restore
verify_restore() {
  log "Verifying restore..."
  
  # Count tables
  table_count=$(mysql \
    --host="$DB_HOST" \
    --user="$DB_USER" \
    --password="$DB_PASSWORD" \
    -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA != 'information_schema' AND TABLE_SCHEMA != 'mysql';" \
    --skip-column-names)
  
  log "✓ Restore verification passed - $table_count tables found"
}

# Clean up
cleanup() {
  log "Cleaning up temporary files..."
  rm -f "$BACKUP_DIR/$BACKUP_FILE"
  rmdir "$BACKUP_DIR" 2>/dev/null || true
}

# Main execution
main() {
  log "=========================================="
  log "Database Restore Started"
  log "=========================================="
  
  verify_env
  create_restore_dir
  get_backup_file
  download_backup
  verify_backup
  confirm_restore
  restore_database
  verify_restore
  cleanup
  
  log "=========================================="
  log "Database Restore Completed Successfully"
  log "=========================================="
}

# Run main function
main
