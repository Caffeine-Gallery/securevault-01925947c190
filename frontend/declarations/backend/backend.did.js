export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getMyFiles' : IDL.Func([], [IDL.Vec(IDL.Text)], []),
    'isAuthenticated' : IDL.Func([], [IDL.Bool], []),
    'uploadFile' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
