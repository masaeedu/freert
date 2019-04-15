const util = require("util");

const test = require("ava");

// prettier-ignore
const { Fn, Arr, Obj, Fnctr, StateT, State, EitherT, Either } = require("@masaeedu/fp");
const { adt, match } = require("@masaeedu/adt");
const { mdo } = require("@masaeedu/do");
const { automonad } = require("@masaeedu/automonad");

const { StateF, ErrorF, LogF, get, put, fail, log } = require("./effects");
const { FreerT, Interp } = require(".");

// :: Map Functor fs -> Functor (Union fs)
const Union = Fs => {
  const index = Arr.foldMap(Obj)(F => Obj["<$"](F)(F.def))(Fs);
  const map = f => v => index[v.label].map(f)(v);
  return { map };
};

test("works", t => {
  // Let's define some computation in terms of our abstract
  // effects

  // We're going to ask the user their name, and provided they don't have
  // some weird name, we're going to greet them

  const weirdnames = ["Wurtzelpfoof"];

  const F = Union([StateF, ErrorF, LogF]);

  const computation = mdo(FreerT)(({ name }) => [
    () => log("Hi! I'm Telly the teletype! Who are you?"),
    [name, () => get],
    () =>
      weirdnames.includes(name)
        ? fail(`${name}? What kind of name is that?`)
        : FreerT.of(undefined),
    () => log(`Hello, ${name}. Nice to meet you.`)
  ]);

  // We're going to interpret our computation into a pure
  // (nested) state transition embedded in an Either

  const { Identity } = Fnctr;
  const { Left, Right } = Either;
  const S = State;

  const M = automonad(Identity)({
    either: EitherT,
    state: StateT,
    log: StateT
  });

  const interpret = Interp(F).iterT(M)(
    match({
      Get: M[">>="](M.state(S.get)),
      Put: s => M["*>"](M.state(S.put(s))),
      Log: w => M["*>"](M.log(S.modify(l => [...l, w]))),
      Fail: e => M.either(Left(e))
    })
  );

  const withName = name =>
    Fn.passthru(computation)([interpret, f => f([]), f => f(name)]);

  // Run the computation with a normal name and a weird name
  const inputs = ["Sally", "Wurtzelpfoof"];

  // Snapshot the results
  inputs.map(withName).forEach(result => t.snapshot(result));
});
