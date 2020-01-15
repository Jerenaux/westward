# Introduction

Thank you for considering contributing to Westward! Here are a few guidelines to help facilitate the experience.

If you plan to make modifications to the source code, check out the :rocket: [Wiki](https://github.com/Jerenaux/westward/wiki), you should find information there that will help you understand the codebase better!

### Possible contributions

If you are **new** to the project and are looking for small, easy tasks to get acquinted with it, let me suggest:
- Fixing typos
- Adding comments
- Filing bug reports (as issues)
- Filing feature requests (as issues) (about the game or about how the project itself is maintained)
- Pointing out (via issues) what parts of the code are particularly unclear
- Hanging out on Slack voice your support
- Spreading the word about Westward

If you are unsure how to go about it, check out that great resource: [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github).

Once you are more **familiar** with the project, your contributions could look like:
- Bug fixes
- Writing tests
- New features
- Writing up documentation

If you are unsure what to work on, check out the [issues section](https://github.com/Jerenaux/westward/issues) which at all times contains a list of identified bugs, feature requests and various other needs of the project. 

Feel free to react to feature requests with emojis to indicate your interest in them, or to comment on them in order to help shape them. This is also a valuable contribution!

If you have **artistic** skills, you are also very welcome to contribute in that way, full credit will be given.

### Process for contributing to the codebase

No changes should ever be done directly to the `master` branch, as this is the "production" branch replicated on the game server.
The main development branch is the `dev` branch, which is periodically merged into `master`. All changes should go through `dev`. 

Please make all your changes in a separate branch in your local version and test them extensively (by testing the affected features
in-game and by running `npm run test`). Once you are satisfied with your changes, you can submit a pull request against the `dev` branch
for review. Looking forward!
