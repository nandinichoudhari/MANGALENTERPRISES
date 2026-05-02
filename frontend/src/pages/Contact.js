function Contact() {
  return (
    <>
      <h2 className="page-title">Contact & Orders</h2>
      <div className="text-box">
        <p><strong>📍 Address:</strong> Dombivli East</p>
        <p><strong>✉️ Email:</strong> <a href="mailto:choudharimangal0@gmail.com">choudharimangal0@gmail.com</a></p>
        <p><strong>📞 Phone/WhatsApp:</strong> <a href="https://wa.me/919892512137" target="_blank" rel="noopener noreferrer">98925 12137</a></p>
        <p><strong>⏰ Timings:</strong> 9 AM - 11 PM</p>
        <p>Message your order with items, quantity, and delivery date.</p>
        <div className="delivery-partners" style={{ marginTop: '24px' }}>
          <p style={{ width: '100%', fontWeight: '700', fontSize: '16px', marginBottom: '12px' }}>Also order online via:</p>
          <a href="https://www.swiggy.com/direct/brand/370609?source=swiggy-direct&subSource=generic" className="btn-swiggy" target="_blank" rel="noopener noreferrer">Swiggy</a>
          <a href="#" className="btn-zomato" target="_blank" rel="noopener noreferrer">Zomato</a>
        </div>
      </div>
    </>
  );
}

export default Contact;
