// const MemoContainer = styled.div`
//   position: absolute;
//   top: 0;
//   left: 0;
//   width: 400px;
//   height: 300px;
//   overflow: auto;
//   background-color: #fff;
//   border: 1px solid #ccc;
//   border-radius: 3px;
//   box-shadow: 0 0 5px #ccc;
//   padding: 10px;
//   font-size: 12px;
//   line-height: 1.5;
//   color: #333;
// `;

// const MemoHeader = styled.div`
//   ${unselectable}
// `;

// const MemoBody = styled.div``;

export default function Memo() {
  return (
    <div>
      <div>
        <label className="text-9xl">{"Hello Memo"}</label>
      </div>
      <div>
        <label>{"This is a body."}</label>
      </div>
    </div>
  );
}
