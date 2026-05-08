import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Folderer",
  description:
    "An Obsidian plugin that runs automated rules on files when they enter monitored folders.",
  base: "/folderer/",

  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      {
        text: "GitHub",
        link: "https://github.com/alvaromateo9/folderer",
      },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Monitored Folders", link: "/guide/monitored-folders" },
          { text: "Rules", link: "/guide/rules" },
          { text: "Conditions", link: "/guide/conditions" },
          { text: "Actions", link: "/guide/actions" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/alvaromateo9/folderer",
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
        "https://github.com/alvaromateo9/folderer/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },
  },
});
