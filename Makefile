CHIP_SRC=src
CHIP_INC=$(CHIP_SRC)/lmfit-6.4

CHIP_SRCS=\
		$(CHIP_INC)/lmcurve.c\
		$(CHIP_INC)/lmmin.c

SRCS=$(CHIP_SRCS) $(CHIP_SRC)/lmfit.js.c

TARGET=lmfit.js
TARGETS=$(TARGET) lmfit.wasm

all: clean lmfit.js

lmfit.js: $(SRCS)
		emcc -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -Os\
		-I$(CHIP_INC) \
		-s EXPORTED_FUNCTIONS="['_do_fit']" -s RESERVED_FUNCTION_POINTERS=20\
		-o $@ --pre-js $(CHIP_SRC)/pre.js --post-js $(CHIP_SRC)/post.js $(SRCS)

clean:
	- rm $(TARGETS)

test:
	- node test.js

