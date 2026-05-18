import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Folderer",
  description:
    "An Obsidian plugin that runs automated rules on files when they enter monitored folders.",
  base: "/folderer/",

  head: [
    [
      "link",
      { rel: "icon", type: "image/svg+xml", href: "/folderer/folder-cog.svg" },
    ],
  ],

  themeConfig: {
    logo: { light: "/folder-cog-light.svg", dark: "/folder-cog-dark.svg" },

    nav: [
      { text: "Docs", link: "/intro/getting-started" },
      {
        text: "GitHub",
        link: "https://github.com/alvaromateo/folderer",
      },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Getting Started", link: "/intro/getting-started" },
          { text: "Monitored Folders", link: "/intro/monitored-folders" },
          { text: "Rules", link: "/intro/rules" },
          { text: "Actions", link: "/intro/actions" },
          { text: "Conditions", link: "/intro/conditions" },
        ],
      },
      {
        text: "Actions",
        items: [
          { text: "Append Text", link: "/actions/append-text" },
          { text: "Prepend Text", link: "/actions/prepend-text" },
          {
            text: "Move to Date Subfolder",
            link: "/actions/move-to-date-subfolder",
          },
          {
            text: "Move to Property Subfolder",
            link: "/actions/move-to-property-subfolder",
          },
          { text: "Move Attachments", link: "/actions/move-attachments" },
        ],
      },
      {
        text: "Conditions",
        items: [
          { text: "File Name", link: "/conditions/file-name" },
          { text: "File Path", link: "/conditions/file-path" },
          { text: "Property", link: "/conditions/property" },
        ],
      },
      {
        text: "Guides",
        items: [{ text: "Guides", link: "/guides/index" }],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/alvaromateo/folderer",
      },
    ],

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026 Alvaro Mateo",
    },

    editLink: {
      pattern:
        "https://github.com/alvaromateo/folderer/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
