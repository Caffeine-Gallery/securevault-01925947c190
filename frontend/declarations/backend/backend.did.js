export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getAllFiles' : IDL.Func([], [IDL.Vec(IDL.Text)], []),
    'uploadFile' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
