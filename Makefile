CHIP_SRC=src
CHIP_INC=$(CHIP_SRC)/lmfit-8.2.2

CHIP_SRCS=\
		$(CHIP_INC)/lmcurve.c\
		$(CHIP_INC)/lmmin.c\
		$(CHIP_INC)/lminvert.c

LMFIT_SRC=$(CHIP_SRCS) $(CHIP_SRC)/lmfit.js.c
LMMIN_SRC=$(CHIP_SRCS) $(CHIP_SRC)/lmmin.js.c

TARGET=lmfit.js
TARGETS=$(TARGET) lmfit.wasm

all: clean lmfit.js

lmfit.js: $(LMFIT_SRC)
		emcc -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -Os\
		-I $(CHIP_INC) \
		-s EXPORTED_FUNCTIONS="['_do_fit', '_do_lmmin']" -s RESERVED_FUNCTION_POINTERS=20\
		-o $@ --pre-js $(CHIP_SRC)/pre.js --post-js $(CHIP_SRC)/post.js $(LMFIT_SRC) $(LMMIN_SRC)

clean:
	- rm $(TARGETS)

test:
	- node test.js

serve: all
	- cp lmfit.js web/gen/
	- cp lmfit.wasm web/gen/
	- emrun --port 8080 web/

