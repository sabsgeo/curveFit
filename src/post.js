/*
  data = {
      f: function (){}  model function
      n: 0              no. of params
    , par:[]            initial param guess
    , m: 0              no. of data points
    , t: []             array x-axis points
    , y: []             array y-axis points
  }
*/
var TIME_DELAY = 50;
var isAsmLoaded = false;

var fit = function (data) { // TODO: Accept strings
  var _fit = function(data, resolve, reject) {
    var ret = {};
    if (!isAsmLoaded) {
      setTimeout(() => {
        _fit(data, resolve, reject);
      }, TIME_DELAY);
    } else {
      /* wrap fitting function */
      var do_fit = cwrap('do_fit', 'number', ['number', 'number', 'number', 'number', 'number', 'number']);
  
      /* model function */
      var f = addFunction(
        function (t, p) {
          /* get array values */
          var p_ = [];
          for (var i = 0; i < data.n; i++)
            p_[i] = getValue(p + i * 8, 'double');
          /* model function evaluation */
          return data.f(t, p_);
        }
      );
  
      var status_code = [ "success (sum of squares below underflow limit)",
                          "success (the relative error in the sum of squares is at most tol)",
                          "success (the relative error between x and the solution is at most tol)",
                          "success (both errors are at most tol)",
                          "trapped by degeneracy (fvec is orthogonal to the columns of the jacobian)",
                          "timeout (number of calls to fcn has reached maxcall*(n+1))",
                          "failure (ftol<tol: cannot reduce sum of squares any further)",
                          "failure (xtol<tol: cannot improve approximate solution any further)",
                          "failure (gtol<tol: cannot improve approximate solution any further)",
                          "exception (not enough memory)",
                          "fatal coding error (improper input parameters)",
                          "exception (break requested within function evaluation)"
                        ]
  
      /* print info while fitting */
      var verbose = data.verbose;
  
      /* no. of params */
      var n = data.n;
  
      /* initial param guess */
      var par = data.par;
  
      /* no. of data points */
      var m = data.m;
  
      /* x-axis values */
      var t = data.t;
  
      /* y-axis values */
      var y = data.y;
  
      /* malloc enough space for the data */
      var par_ptr = _malloc(par.length * par.BYTES_PER_ELEMENT);
      var res_ptr = _malloc(m * par.BYTES_PER_ELEMENT);
      var fit_ptr = _malloc(m * par.BYTES_PER_ELEMENT);
      var more_info_ptr = _malloc(3 * par.BYTES_PER_ELEMENT);
  
      var t_ptr = _malloc(t.length * t.BYTES_PER_ELEMENT);
      var y_ptr = _malloc(y.length * y.BYTES_PER_ELEMENT);
  
      // Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
      var par_dataHeap = new Uint8Array(Module.HEAPU8.buffer, par_ptr, par.length * par.BYTES_PER_ELEMENT);
      var t_dataHeap = new Uint8Array(Module.HEAPU8.buffer, t_ptr, t.length * t.BYTES_PER_ELEMENT);
      var y_dataHeap = new Uint8Array(Module.HEAPU8.buffer, y_ptr, y.length * y.BYTES_PER_ELEMENT);
  
      par_dataHeap.set(new Uint8Array(par.buffer));
      t_dataHeap.set(new Uint8Array(t.buffer));
      y_dataHeap.set(new Uint8Array(y.buffer));
  
  
      ret.ret = do_fit(n, par_ptr, m, t_ptr, y_ptr, f, res_ptr, fit_ptr, more_info_ptr, +verbose);
  
      ret.params = [];
      ret.resudue = [];
      ret.fit = [];
      ret.nfev = 0;
      ret.fnorm = 0.0;
      ret.message = "";
      for (var i = 0; i < par.length; i++)
        ret.params[i] = getValue(par_ptr + i * par.BYTES_PER_ELEMENT, 'double');
      
      for (var i = 0; i < m; i++) {
        ret.resudue[i] = getValue(res_ptr + i * par.BYTES_PER_ELEMENT, 'double');
        ret.fit[i] = getValue(fit_ptr + i * par.BYTES_PER_ELEMENT, 'double');
      }
      ret.nfev = parseInt(getValue(more_info_ptr + 0 * par.BYTES_PER_ELEMENT, 'double'));
      ret.fnorm = getValue(more_info_ptr + 1 * par.BYTES_PER_ELEMENT, 'double');
      ret.message = status_code[parseInt(getValue(more_info_ptr + 2 * par.BYTES_PER_ELEMENT, 'double'))]
      removeFunction(f);
      /* free the heap buffer */
      _free(par_ptr);
      _free(t_ptr);
      _free(y_ptr);
      _free(res_ptr);
      _free(fit_ptr);
      resolve(ret);
    }
  }
  
  return new Promise(function(resolve, reject) {
    _fit(data, resolve, reject);
  });
};

Module.onRuntimeInitialized = function() {
  isAsmLoaded = true;
}

this['lmfit'] = {
  'fit': fit
};

return this['lmfit'];

})();

if (typeof module !== 'undefined') module.exports = lmfit;
if (typeof define === 'function') define(lmfit);
