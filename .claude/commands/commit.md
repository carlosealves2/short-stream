# Smart Commit Command

Analyze the current git changes and create organized commits following the Conventional Commit standard.

## Instructions:

1. **Analyze Changes**: Run `git status` and `git diff` to see all modifications, including staged and unstaged changes.

2. **Group by Functionality**: Examine all changes and group them into logical, cohesive commits based on:
   - Related functionality or feature
   - Type of change (feat, fix, refactor, test, docs, etc.)
   - Affected components or modules
   - Each group should represent a single, atomic change

3. **Create Conventional Commits**: For each group, create a commit following this format:
   ```
   <type>(<scope>): <description>

   [optional body with more details]
   ```

   **Types to use:**
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes (formatting, missing semicolons, etc.)
   - `refactor`: Code refactoring without changing functionality
   - `test`: Adding or updating tests
   - `chore`: Maintenance tasks, dependencies, configuration
   - `perf`: Performance improvements
   - `ci`: CI/CD changes
   - `build`: Build system or dependencies changes
   - `revert`: Revert previous commit

4. **Commit Guidelines**:
   - Use clear, descriptive commit messages in English
   - Keep the subject line under 72 characters
   - Use imperative mood ("add feature" not "added feature")
   - Add body if the change needs explanation
   - IMPORTANT: Do NOT include any reference to AI, Claude, or code generation tools in commit messages
   - Focus on WHAT changed and WHY, not HOW it was implemented

5. **Execute Commits**: Stage and commit each group sequentially, showing the user what was committed.

6. **Summary**: After all commits are done, show a summary of all commits created with their messages.

## Example output format:

```
Created 3 commits:

1. feat(auth): add password reset functionality
2. test(auth): add unit tests for password reset
3. docs(readme): update authentication section
```

IMPORTANT: Never use git push unless explicitly requested by the user. Only create local commits.
IMPORTANT: Never mention the Claude code in the commit message.