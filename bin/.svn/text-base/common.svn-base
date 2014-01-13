#!/bin/sh

DIR_LIB=$DIR_HOME/lib
DIR_CONFIG=$DIR_HOME/conf

JARS=`find $DIR_LIB -name "*.jar"`

JAR=""
for JAR_FILE in $JARS; do
	JAR=$JAR:$JAR_FILE
done

CLASSPATH=$DIR_CONFIG:$JAR

OPT_LOGGING="-Dlog4j.configuration=log4j.xml"
OPT_PRG_NAME="-Dcli.name=$SCRIPT"

READ_ARG="n"

OPT_TRACE=

for WORD in $@; do
        if [ "y" = "$READ_ARG" ]
        then
                OPT_LOGGING="-Dlog4j.configuration=log4j-${WORD}.xml"
                if [ "$WORD" = "trace" ]
                then
                        OPT_TRACE="-Dlog4j.debug=true"
                fi
                READ_ARG="n"
        fi
        case $WORD in
        "--log" | "-l" )
        READ_ARG="y"
        ;;
        esac
done

OPT="$OPT_TRACE $OPT_LOGGING $OPT_PRG_NAME"

escapeSpace() {
    printf "%s" "$1" | sed 's/\\/\\\\/g' | sed 's/ /\\ /g'
}

