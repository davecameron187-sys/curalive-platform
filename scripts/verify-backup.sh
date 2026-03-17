#!/bin/bash

###############################################################################
# Backup Verification Script for Chorus AI
# Verifies latest backup integrity and connectivity
# 
# Usage: ./verify-backup.sh [backup-file]
# 
# Environment Variables:
#   S3_BUCKET - S3 bucket name (default: chorus-ai-backups)
#   BACKUP_LOG - Log file path (optional)
###############################################################################

set -e

# Configuration
S3_BUCKET="${S3_BUCKET:-chorus-ai-backups}"
BACKUP_LOG="${BACKUP_LOG:-/var/log/chorus-ai-backups.log}"
BACKUP_DIR="/tmp/backup-verify"

# Log function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_LOG"
}

# Error handler
error_exit() {
  log "ERROR: $1"
  exit 1
}

# Create verification directory
mkdir -p "$BACKUP_DIR"

# Get latest backup from S3
get_latest_backup() {
  log "Fetching latest backup from S3..."
  
  LATEST_BACKUP=$(aws s3 ls "s3://$S3_BUCKET/" | grep "chorus-ai-backup-" | sort | tail -n 1 | awk '{print $4}')
  
  if [ -z "$LATEST_BACKUP" ]; then
    error_exit "No backups found in S3 bucket: $S3_BUCKET"
  fi
  
  log "Latest backup found: $LATEST_BACKUP"
}

# Download backup
download_backup() {
  log "Downloading backup from S3..."
  
  if aws s3 cp "s3://$S3_BUCKET/$LATEST_BACKUP" "$BACKUP_DIR/$LATEST_BACKUP" --region us-east-1; then
    log "Backup downloaded successfully"
  else
    error_exit "Failed to download backup from S3"
  fi
}

# Verify backup integrity
verify_integrity() {
  log "Verifying backup integrity..."
  
  if gunzip -t "$BACKUP_DIR/$LATEST_BACKUP" 2>/dev/null; then
    log "✓ Backup integrity verified - file is valid gzip"
  else
    error_exit "✗ Backup integrity check failed - file may be corrupted"
  fi
}

# Check backup size
check_size() {
  local size=$(du -h "$BACKUP_DIR/$LATEST_BACKUP" | cut -f1)
  log "Backup size: $size"
  
  # Warn if backup is suspiciously small (< 1MB)
  local size_bytes=$(du -b "$BACKUP_DIR/$LATEST_BACKUP" | cut -f1)
  if [ "$size_bytes" -lt 1048576 ]; then
    log "WARNING: Backup size is very small (< 1MB) - may indicate incomplete backup"
  fi
}

# Test restore (optional - dry run)
test_restore() {
  log "Testing restore capability (dry run)..."
  
  if gunzip -c "$BACKUP_DIR/$LATEST_BACKUP" | head -100 | grep -q "CREATE TABLE"; then
    log "✓ Restore test passed - backup contains valid SQL"
  else
    error_exit "✗ Restore test failed - backup may be invalid"
  fi
}

# Generate report
generate_report() {
  log "=========================================="
  log "Backup Verification Report"
  log "=========================================="
  log "Backup File: $LATEST_BACKUP"
  log "S3 Location: s3://$S3_BUCKET/$LATEST_BACKUP"
  log "File Size: $(du -h "$BACKUP_DIR/$LATEST_BACKUP" | cut -f1)"
  log "Download Date: $(date)"
  log "Integrity: PASSED"
  log "Restore Test: PASSED"
  log "=========================================="
}

# Clean up
cleanup() {
  log "Cleaning up temporary files..."
  rm -f "$BACKUP_DIR/$LATEST_BACKUP"
}

# Main execution
main() {
  log "=========================================="
  log "Backup Verification Started"
  log "=========================================="
  
  get_latest_backup
  download_backup
  verify_integrity
  check_size
  test_restore
  generate_report
  cleanup
  
  log "=========================================="
  log "Backup Verification Completed Successfully"
  log "=========================================="
}

# Run main function
main
