const { adt, match, otherwise } = require("@masaeedu/adt");
const {
  Fn,
  Arr,
  Cont,
  implement,
  Functor,
  Apply,
  Chain
} = require("@masaeedu/fp");

// :: type FreerInput f a r = ADT '{ Pure: '[a], Bind: '[f x, x -> r] }

const FreerInput = adt({ Pure: ["a"], Bind: ["f x", "x -> r"] });
const { Pure, Bind } = FreerInput;

// :: type FreerT f m a = (FreerInput f a (m r) -> m r) -> m r

// :: Monad (FreerT f m)
const FreerT = (() => {
  const monad = Fn.pipe(Arr.map(implement)([Chain, Apply, Functor, Apply]));

  // :: a -> FreerT f m a
  const of = a => Cont.of(Pure(a));

  // :: (a -> FreerT f m b) -> FreerT f m a -> FreerT f m b
  const chain = amb =>
    Cont.chain(
      match({
        Pure: amb,
        [otherwise]: Cont.of
      })
    );

  // :: Monad m -> m a -> FreerT f m a
  const lift = M => ma => cb => M.chain(a => cb(Pure(a)))(ma);

  return { ...monad({ of, chain }), lift };
})();

const Interp = F => {
  // :: f (FreerT f m a) -> FreerT f m a
  const wrap = fr => cb => cb(Bind(fr)(ft => ft(cb)));

  // :: f a -> FreerT f m a
  const liftF = fa => wrap(F.map(FreerT.of)(fa));

  // :: Monad m -> (f (m a) -> m a) -> FreerT f m a -> m a
  const iterT = M => phi => m =>
    m(
      match({
        // :: a -> m a
        Pure: M.of,
        // :: f x -> (x -> m r) -> m a
        Bind: f => xmr => phi(F.map(xmr)(f))
      })
    );

  return { wrap, liftF, iterT };
};

module.exports = { FreerT, Interp };
