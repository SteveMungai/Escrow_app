function Footer(){
    return(
        <footer className="footer">
        <img
          src="./animal.png"
          alt="Animal illustration"
          style={{ width: "25px", height: "25px", objectFit: 'cover', filter: 'brightness(0) invert(1)' }}
        />
            <span className="footer-text">SecurePay</span>
        </footer>

    )
}

export default Footer