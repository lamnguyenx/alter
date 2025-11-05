.PHONY: all clean

VERSION := $(shell grep '"version"' manifest.json | cut -d'"' -f4)
XPI_NAME = build/clickshell-$(VERSION).xpi
FILES = manifest.json background.js content.js options.html options.js mouse-icon.svg

all: $(XPI_NAME)

$(XPI_NAME): $(FILES)
	mkdir -p build
	zip -r $@ $^

clean:
	rm -rf build/
