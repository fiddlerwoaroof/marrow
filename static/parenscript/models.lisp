(ql:quickload :parenscript)

(defpackage :angular
  (:use :parenscript :cl)
  (:export main))

(in-package :angular)
(use-package :parenscript)

(defmacro+ps scope-var (name value)
  `(setf ($s ,name) ,value))

(defmacro+ps scope-function (name arguments &body body)
  `(scope-var ,name (lambda ,arguments
                      ,@body)))

; The name of the angular module
(defvar *ang-module* nil)


(defmacro+ps $s (&rest values) `(chain $scope ,@values))

(defmacro+ps def-module (name dependencies)
  `(progn (var ,name ((@ angular module) ,(symbol-to-js-string name) ,dependencies))))

(defun build-lambda (dependencies body)
  `(list ,@(mapcar #'symbol-to-js-string dependencies)
         (lambda ,(loop for x in dependencies
                        collect x)
           ,@body
           nil)))

(defmacro+ps select-> (selector)
  `(chain document (query-selector ,selector)))

(defmacro+ps select->element (selector)
  `(chain angular (element (select-> ,selector))))

(defmacro+ps defcontroller (angmodule name dependencies &body body)
  (let ((dependencies (cons '$scope dependencies)))
    `(chain ,angmodule (controller ,name ,(build-lambda dependencies body)))))

(defmacro+ps ng-ajax (mthd endpoint data resultS &body callback)
  `(chain $http
          (,mthd ,endpoint ,data)
          (success (lambda (,resultS)
                     ,@callback))))

(defun translate-file (infile outfile)
  (let ((*JS-TARGET-VERSION* 1.9))
    (with-open-file (o outfile :direction :output)
      (with-open-file (i infile :direction :input)
        (write-line (ps-compile-file i) o)))))

(defun main (args)
  (in-package :angular)
  (apply #'translate-file (cdr args)))


