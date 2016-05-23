(defmacro defclass-simple [name bases slots &rest definitions]
  `(defclass ~name ~bases
     [[--init-- (fn [self ~@slots]
                  (do ~@(list-comp
                         `(setv (. self ~slot) ~slot)
                         (slot slots)))
                  nil)]]))

(defclass test1 [object]
  [[a 2]
   [c (fn [self] self)]])

(defclass-simple sdf [object]
  [a b c])
