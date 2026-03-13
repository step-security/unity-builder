# Unity - Builder
[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)


## How to use

```yml
name: Actions 😎

on: [push, pull_request]

jobs:
  build:
    name: Build my project ✨
    runs-on: ubuntu-latest
    steps:
      # Checkout
      - name: Checkout repository
        uses: actions/checkout@v6
        with:
          lfs: true

      # Cache
      - uses: actions/cache@v5
        with:
          path: Library
          key: Library-${{ hashFiles('Assets/**', 'Packages/**', 'ProjectSettings/**') }}
          restore-keys: |
            Library-

      # Test
      - name: Run tests
        uses: game-ci/unity-test-runner@v4
        env:
          UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
          UNITY_EMAIL: ${{ secrets.UNITY_EMAIL }}
          UNITY_PASSWORD: ${{ secrets.UNITY_PASSWORD }}
        with:
          githubToken: ${{ secrets.GITHUB_TOKEN }}

      # Build
      - name: Build project
        uses: step-security/unity-builder@v4
        env:
          UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
          UNITY_EMAIL: ${{ secrets.UNITY_EMAIL }}
          UNITY_PASSWORD: ${{ secrets.UNITY_PASSWORD }}
        with:
          targetPlatform: WebGL

      # Output
      - uses: actions/upload-artifact@v7
        with:
          name: Build
          path: build
```

Find the
[docs](https://game.ci/docs/github/builder)
on the GameCI
[documentation website](https://game.ci/docs).

## Licence

This repository is [MIT](./LICENSE) licensed.

This includes all contributions from the community.
