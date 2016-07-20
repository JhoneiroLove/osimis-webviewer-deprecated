#!/bin/bash
set -e
set -x

# start from the right place
cd "${REPOSITORY_PATH:-$(git rev-parse --show-toplevel)}"/


gitLongTag=$(git describe --long --dirty)
branchName=${1:-$(git rev-parse --abbrev-ref HEAD)} #if no argument defined, get the branch name from git
releaseCommitId=$(git rev-parse --short HEAD)

if [[ $branchName == "master" ]]; then
	
	# in the master branch, make sure the tag is clean ('1.2.3'; not 1.2.3-alpha) and there has been 0 commits since the tag has been set.
	if [[ $gitLongTag =~ [0-9]+.[0-9]+.[0-9]+-0-[0-9a-g]{8}$ ]]; then 

		releaseTag=$(echo $gitLongTag | sed -r "s/([0-9]+\.[0-9]+\.[0-9]+)-[0-9]+-.+/\1/")
	else

		echo "Invalid tag on the master branch.  Make sure you have just tagged the master branch with something like '1.2.3' and that there has been no commit after the tag."
		exit -1	
	fi

else
	# in other branches than master, the versionNumber is the branchName
	releaseTag=$branchName
	
	# if the branch name is something like 'am/WVB-27', the image tag should be 'am-WVB-27'
	# replace / by -
	releaseTag=${releaseTag//\//-}
fi

# display what has changed in git
git status