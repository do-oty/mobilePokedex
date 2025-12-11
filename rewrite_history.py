#!/usr/bin/env python3
"""
Remove secrets from git history by rewriting commits
"""
import subprocess
import sys
import os

SECRET_FILES = [
    'android/app/google-services.json',
    'android/app/debug.keystore',
    'ios/.xcode.env'
]

def run_git(cmd, check=True):
    """Run a git command"""
    result = subprocess.run(['git'] + cmd, capture_output=True, text=True, check=check)
    return result.stdout.strip()

def main():
    print("Creating backup branch...")
    run_git(['branch', 'backup-before-secret-removal'], check=False)
    
    print("Getting all commits...")
    commits = run_git(['log', '--reverse', '--pretty=format:%H']).split('\n')
    
    print(f"Found {len(commits)} commits to process")
    
    # Create a new orphan branch
    print("Creating new orphan branch...")
    run_git(['checkout', '--orphan', 'temp-clean'])
    run_git(['rm', '-rf', '.'])
    
    # Process each commit
    for i, commit in enumerate(commits):
        if not commit:
            continue
        print(f"Processing commit {i+1}/{len(commits)}: {commit[:8]}")
        
        # Checkout the commit
        run_git(['checkout', commit, '--', '.'])
        
        # Remove secret files
        for secret_file in SECRET_FILES:
            if os.path.exists(secret_file):
                os.remove(secret_file)
        
        # Stage all changes
        run_git(['add', '-A'])
        
        # Get commit message
        msg = run_git(['log', '-1', '--pretty=format:%B', commit])
        author = run_git(['log', '-1', '--pretty=format:%an <%ae>', commit])
        date = run_git(['log', '-1', '--pretty=format:%ai', commit])
        
        # Create new commit
        env = os.environ.copy()
        env['GIT_AUTHOR_NAME'] = author.split(' <')[0]
        env['GIT_AUTHOR_EMAIL'] = author.split('<')[1].rstrip('>')
        env['GIT_AUTHOR_DATE'] = date
        env['GIT_COMMITTER_NAME'] = author.split(' <')[0]
        env['GIT_COMMITTER_EMAIL'] = author.split('<')[1].rstrip('>')
        env['GIT_COMMITTER_DATE'] = date
        
        subprocess.run(['git', 'commit', '-m', msg], env=env, check=False)
    
    print("\nHistory rewritten! Now run:")
    print("  git branch -D main")
    print("  git branch -m main")
    print("  git push --force origin main")

if __name__ == '__main__':
    main()

