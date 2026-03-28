#!/bin/bash

###############################################################################
# Manus GitHub Sync Script - Pull ChatGPT Updates
# 
# This script fetches the latest updates from ChatGPT on the ManusChatgpt
# branch and merges them into the local development branch.
#
# Usage: ./scripts/pull-chatgpt-updates.sh
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_PATH="/home/ubuntu/chorus-ai"
REMOTE_NAME="github"
BRANCH_NAME="ManusChatgpt"
GH_TOKEN="${GH_TOKEN:-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}"

# Functions
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Main script
main() {
    print_header "Manus GitHub Sync - Pull ChatGPT Updates"
    
    # Step 1: Verify we're in the right directory
    print_info "Checking repository path..."
    if [ ! -d "$REPO_PATH/.git" ]; then
        print_error "Not a git repository: $REPO_PATH"
        exit 1
    fi
    print_success "Repository found at $REPO_PATH"
    
    # Step 2: Change to repo directory
    cd "$REPO_PATH"
    
    # Step 3: Verify remote exists
    print_info "Verifying GitHub remote..."
    if ! git remote | grep -q "^$REMOTE_NAME$"; then
        print_error "Remote '$REMOTE_NAME' not found"
        print_info "Available remotes:"
        git remote -v
        exit 1
    fi
    print_success "Remote '$REMOTE_NAME' found"
    
    # Step 4: Fetch latest from ChatGPT branch
    print_info "Fetching latest updates from $BRANCH_NAME..."
    if git fetch "$REMOTE_NAME" "$BRANCH_NAME" 2>&1; then
        print_success "Fetch successful"
    else
        print_error "Failed to fetch from remote"
        exit 1
    fi
    
    # Step 5: Show what's new
    print_info "Changes from ChatGPT:"
    echo ""
    git log --oneline "HEAD..$REMOTE_NAME/$BRANCH_NAME" || print_info "No new commits"
    echo ""
    
    # Step 6: Check current branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    print_info "Current branch: $CURRENT_BRANCH"
    
    # Step 7: Show diff summary
    print_info "Diff summary:"
    echo ""
    git diff --stat "HEAD..$REMOTE_NAME/$BRANCH_NAME" || print_info "No changes"
    echo ""
    
    # Step 8: Merge or rebase (default: merge)
    print_info "Merging ChatGPT updates into $CURRENT_BRANCH..."
    if git merge "$REMOTE_NAME/$BRANCH_NAME" --no-edit 2>&1; then
        print_success "Merge successful"
    else
        print_warning "Merge conflict detected"
        print_info "Conflicted files:"
        git diff --name-only --diff-filter=U
        echo ""
        print_warning "Please resolve conflicts manually:"
        print_info "1. Edit conflicted files"
        print_info "2. Run: git add ."
        print_info "3. Run: git commit -m 'Resolve merge conflicts from ChatGPT'"
        print_info "4. Run: git push $REMOTE_NAME $BRANCH_NAME"
        exit 1
    fi
    
    # Step 9: Push back to remote
    print_info "Pushing merged changes back to $REMOTE_NAME/$BRANCH_NAME..."
    if git push "$REMOTE_NAME" "$BRANCH_NAME" 2>&1; then
        print_success "Push successful"
    else
        print_error "Failed to push to remote"
        exit 1
    fi
    
    # Step 10: Summary
    print_header "Sync Complete ✓"
    print_success "ChatGPT updates have been pulled and merged"
    print_info "Latest commits:"
    git log --oneline -5
    echo ""
    print_info "Next steps:"
    print_info "1. Review merged changes: git diff HEAD~1"
    print_info "2. Run tests: pnpm test"
    print_info "3. Check dev server: pnpm dev"
}

# Error handling
trap 'print_error "Script failed"; exit 1' ERR

# Run main function
main "$@"
