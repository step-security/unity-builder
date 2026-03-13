#!/usr/bin/env bash

if [ -z "${GIT_PRIVATE_TOKEN}" ]
then
  echo "GIT_PRIVATE_TOKEN unset skipping"
else
  echo "GIT_PRIVATE_TOKEN is set configuring git credentials"

	git config --global credential.helper store
	git config --global --replace-all url."https://token:$GIT_PRIVATE_TOKEN@github.com/".insteadOf ssh://git@github.com/
	git config --global --add url."https://token:$GIT_PRIVATE_TOKEN@github.com/".insteadOf git@github.com
  git config --global --add url."https://token:$GIT_PRIVATE_TOKEN@github.com/".insteadOf "https://github.com/"
  
  git config --global url."https://ssh:$GIT_PRIVATE_TOKEN@github.com/".insteadOf "ssh://git@github.com/"
  git config --global url."https://git:$GIT_PRIVATE_TOKEN@github.com/".insteadOf "git@github.com:"

fi

echo "---------- git config --list (filtered) -------------"
git config --list | sed -E 's/(token:|ssh:|git:)[^@]+@/\1***@/g'

echo "---------- git config --list --show-origin (filtered) -------------"
git config --list --show-origin | sed -E 's/(token:|ssh:|git:)[^@]+@/\1***@/g'

