# WilkinsNaylorHomes

## Working on this repository in VS Code

This section is for anyone who is new to Git, GitHub, and VS Code.

Before you start work:

1. Open VS Code.
2. Open this repository folder.
3. Click the **Source Control** icon on the left side of VS Code. It looks like a branching line.
4. Click the **three dots** menu at the top of the Source Control panel.
5. Click **Pull**.
6. Wait for VS Code to finish pulling before you edit anything.

Always pull every time before you start working on the repository. This makes sure you have the newest version of the website before you make changes.

While you are working:

1. Edit the files you need to change.
2. Save your files.
3. Go back to the **Source Control** panel.
4. Check the list of changed files to make sure it only includes the files you meant to edit.

When you are finished:

1. In the **Source Control** panel, click the **+** button next to each file you want to include. This stages the changes.
2. Type a short message in the message box explaining what you changed, for example `Update blog text` or `Change homepage images`.
3. Click **Commit**.
4. Click **Sync Changes** if you see it.
5. If you do not see **Sync Changes**, click the **three dots** menu and click **Push**.

Always push when you finish working. This uploads your saved changes so everyone else can pull the newest version next time.

## Testing the site before you push

You can test the website on your own computer before you commit or push. This lets you check your changes without uploading them.

To test with Live Server:

1. In VS Code, click the **Extensions** icon on the left side.
2. Search for **Live Server**.
3. Install the extension called **Live Server** by **Ritwick Dey** if it is not already installed.
4. Open the file you want to preview, for example [docs/index.html](/Users/Malachi/Documents/WilkinsNaylorHomes/docs/index.html).
5. Click **Go Live** in the bottom-right corner of VS Code.
6. A browser window should open with the local version of the website.
7. Make your changes in VS Code, save the file, and check the browser again.

Testing with Live Server does not push anything to GitHub. It only shows the website from your own computer, so it is safe to use before committing and pushing.

## Blog editing

The blog now uses simple markdown files in [src/content/blog](/Users/Malachi/Documents/WilkinsNaylorHomes/src/content/blog).

To add a post:

1. Duplicate [src/content/blog/_template.md](/Users/Malachi/Documents/WilkinsNaylorHomes/src/content/blog/_template.md).
2. Rename it to the page URL you want, for example `new-kitchen-upgrade.md`.
3. Fill in the front matter at the top:
   `title`, `date`, and `excerpt` are required.
4. Write the article underneath using simple formatting:
   `##` for large headings, `###` for smaller headings, `-` for bullet points, `**bold**` for bold text, `[[br]]` for a manual line break.
5. Run `node scripts/generate-blog-posts.js`.

That command rebuilds:

- [docs/js/posts.js](/Users/Malachi/Documents/WilkinsNaylorHomes/docs/js/posts.js) for the blog listing and homepage preview
- [docs/blog](/Users/Malachi/Documents/WilkinsNaylorHomes/docs/blog) for the individual post pages
