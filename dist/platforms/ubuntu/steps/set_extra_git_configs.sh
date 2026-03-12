#!/usr/bin/env bash

if [ -z "${GIT_CONFIG_EXTENSIONS}" ]
then
  echo "GIT_CONFIG_EXTENSIONS unset skipping"
else
  echo "GIT_CONFIG_EXTENSIONS is set configuring extra git configs"

  IFS=$'\n'
  for config in $(echo "${GIT_CONFIG_EXTENSIONS}" | sed 's/\(.*\)=\(.*\)/"\1" "\2"/g'); do
    if [[ $config =~ \"([^\"]+)\"\ \"([^\"]+)\" ]]; then
      key="${BASH_REMATCH[1]}"
      value="${BASH_REMATCH[2]}"
    else
      echo "Error parsing config: $config"
      exit 1
    fi
    echo "Adding extra git config: \"$key\" = \"$value\""
    git config --global --add "$key" "$value"
  done
  unset IFS

fi

echo "---------- git config --list (filtered) -------------"
git config --list | sed -E 's/(token:|ssh:|git:)[^@]+@/\1***@/g'

echo "---------- git config --list --show-origin (filtered) -------------"
git config --list --show-origin | sed -E 's/(token:|ssh:|git:)[^@]+@/\1***@/g'
