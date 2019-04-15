const { adt, match } = require("@masaeedu/adt");
const { Fn } = require("@masaeedu/fp");

const { Interp } = require(".");

// # STATE

// :: type StateF s r = ADT '{ Get: '[s -> r], Put: '[s, r] }

const StateF = adt({ Get: ["s -> r"], Put: ["s", "r"] });
const { Get, Put } = StateF;

StateF.map = f =>
  match({
    Get: t => Get(s => f(t(s))),
    Put: s => a => Put(s)(f(a))
  });

// :: FreerT (StateF s) m s
const get = Interp(StateF).liftF(Get(Fn.id));
// :: s -> FreerT (StateF s) m ()
const put = s => Interp(StateF).liftF(Put(s)(undefined));

// # ERROR

// :: type ErrorF e r = ADT '{ Fail: '[e] }

const ErrorF = adt({ Fail: ["e"] });
const { Fail } = ErrorF;

ErrorF.map = _ => x => x;

// :: e -> FreerT (ErrorF e) m ()
const fail = e => Interp(ErrorF).liftF(Fail(e));

// # LOG

// :: type LogF w r = ADT '{ Log: '[w, r] }

const LogF = adt({ Log: ["w", "r"] });
const { Log } = LogF;

LogF.map = f =>
  match({
    Log: w => r => Log(w)(f(r))
  });

// :: w -> FreerT (LogF w) m ()
const log = w => Interp(LogF).liftF(Log(w)(undefined));

module.exports = { StateF, LogF, ErrorF, get, put, fail, log };
