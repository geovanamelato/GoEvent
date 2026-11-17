import React from 'react';

function NavbarItem({ render, ...props }) {
  if (render) {
   
    const ativo = window.location.pathname === props.href;
    return (
      <li className='nav-item'>
        <a
          onClick={props.onClick}
          className={ativo ? 'nav-link active fw-bold' : 'nav-link'}
          href={props.href}
        >
          {props.label}
        </a>
      </li>
    );
  } else {
    return false;
  }
}

export default NavbarItem;