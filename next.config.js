const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias["@"] = path.join(__dirname);
    return config;
  },
};

module.exports = nextConfig;
