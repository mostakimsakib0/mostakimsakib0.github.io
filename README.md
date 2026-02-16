# Mostakim Sakib Portfolio

Hugo-powered portfolio and publishing platform for Md. Mostakim Ahmed Sakib.

## Local development

- Start the dev server: `hugo server -D`
- Build for production: `hugo`

## Content editing (Netlify CMS)

The CMS is available at `/admin` after deployment. Content is stored in Hugo `content/` and committed to the repository.

### OAuth setup notes (GitHub)

This repo ships with a Netlify CMS GitHub backend scaffold in [static/admin/config.yml](static/admin/config.yml). To enable secure login:

1. Deploy the site to Netlify and link it to the GitHub repository.
2. Configure an OAuth provider for Netlify CMS.
	- Option A: Use Netlify CMS OAuth provider (recommended when hosted on Netlify). Deploy the `netlify-cms-oauth-provider` and set `auth_endpoint` to its URL.
	- Option B: Use Netlify Identity + Git Gateway. Switch `backend.name` to `git-gateway` and enable Identity and Git Gateway in Netlify.
3. Update the `repo` value in [static/admin/config.yml](static/admin/config.yml) if the repository name or owner changes.

## Customization checklist

- Update `baseURL` in [config.toml](config.toml).
- Replace placeholders in [data/profile.yml](data/profile.yml), [data/projects.yml](data/projects.yml), and [data/achievements.yml](data/achievements.yml).
- Edit section copy in `content/` for About, Projects, Blog, Achievements, and Contact.

## Theme

Custom Hugo theme lives in `themes/mostakim` with a light/dark mode toggle and clean, minimal layout.