# Semantic versioning depends on https://github.com/fmahnke/shell-semver

# MAIN IMAGE TAG, UPDATE THIS FOR EACH PROJECT
# IMAGE_TAG=not-using-this

# check for semantic version
VERFILE=./version.conf
SEMVER_UPDATER=./shell-semver-master/increment_version.sh
VERSION_BUMP_FLAG=$1

if test -f "$VERFILE"
then
    echo "== Current version: $(cat $VERFILE)"
else
    echo "== Creating $VERFILE and setting current version to 0.0.0"
    echo 0.0.0 > $VERFILE
fi

if [ "$1" == "-M" ]
then
    echo "== Updating major version"
elif [ "$1" == "-m" ]
then
    echo "== Updating minor version"
elif [ "$1" == "-p" ]
then
    echo "== Updating patch version"
elif [ "$1" == "" ]
then
    echo "== Not performing version update"
else
    echo "== Unexpected flag $1"
    exit 1
fi

c="$SEMVER_UPDATER $1 $(cat $VERFILE)"
# echo "$c"
NEWVER=$($c)
# echo "$NEWVER"
echo $NEWVER > $VERFILE

echo "== New version: $NEWVER"

# d="docker build -t $IMAGE_TAG:latest .."

# echo "=================="
# echo "== $d"
# $d
