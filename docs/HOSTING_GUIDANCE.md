# Hosting Guidance

GitHub Pages serves static HTML, CSS, and JavaScript files from a repository. It can publish from a branch or a GitHub Actions workflow, but it cannot run the tracker’s protected Node server, database procedures, Manus OAuth callback, S3 upload path, or server-side LLM calls.

For the complete application, use the project’s built-in hosting by opening the latest project checkpoint and selecting **Publish** in the project interface. This preserves the managed server, database, authentication, storage, and server-side AI functionality.

GitHub Pages is still useful for a separate static portfolio page or documentation site. To enable it, open the repository’s **Settings → Pages**, choose either **Deploy from a branch** or **GitHub Actions**, select the publishing source, and save the configuration. The resulting project-site address follows the `https://<owner>.github.io/<repository>` pattern.

References:

- GitHub Docs, [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- GitHub Docs, [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
