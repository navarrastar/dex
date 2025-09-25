import React from 'react'; // Make sure to import React
import Draggable from 'react-draggable';
import logo from '../../assets/deadlock-logo-circle.png'

export default function App() {
  const nodeRef = React.useRef(null);

  
  return (
    <Draggable
      nodeRef={nodeRef} // This part is correct
    >
      <img
        ref={nodeRef}
        draggable="false"
        src={logo}
        style={{ width: 48, height: 48, cursor: 'pointer', userSelect: 'none'}}
      />
    </Draggable>
  );
}