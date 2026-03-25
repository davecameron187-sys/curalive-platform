# Branch Protection Rules — Configure in GitHub Settings

## `main` branch
- Require pull request before merging
- Require at least 1 approval
- Require status checks to pass: `build`
- Do not allow direct pushes
- Include administrators

## `shadow-mode` branch
- Require pull request before merging
- Require status checks to pass: `build`
- Do not allow direct pushes

## `develop` branch
- Require status checks to pass: `build`
- Allow direct pushes (integration branch)

## How to configure
1. Go to repo Settings → Branches → Add branch protection rule
2. Enter branch name pattern (e.g., `main`)
3. Check the boxes listed above
4. Save changes
5. Repeat for `shadow-mode`
