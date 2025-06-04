# Assets Folder

This folder contains static assets for the Wildfire Forecast Map application.

## Folder Structure

```
assets/
├── images/          # Application images (logos, backgrounds, etc.)
├── icons/           # Icon files (SVG, PNG icons)
└── README.md        # This file
```

## Usage

### Adding a Logo
Place your logo file in the `images/` directory and reference it in your HTML/CSS:

```html
<!-- In HTML -->
<img src="/assets/images/logo.svg" alt="Company Logo" />

<!-- Or in CSS -->
.logo {
  background-image: url('/assets/images/logo.svg');
}
```

### Adding Icons
Place icon files in the `icons/` directory:

```html
<img src="/assets/icons/wildfire-icon.svg" alt="Wildfire Icon" />
```

## Supported File Types
- **Images**: SVG, PNG, JPG, WebP
- **Icons**: SVG (recommended), PNG

## Best Practices
- Use SVG format for logos and icons when possible (scalable and small file size)
- Optimize images before adding them to the repository
- Use descriptive filenames (e.g., `company-logo.svg`, `wildfire-cluster-icon.svg`) 