import { FiMapPin, FiMail, FiPhone, FiClock } from "react-icons/fi";

function Contact() {
  return (
    <>
      <h2 className="page-title">Contact & Orders</h2>
      <div className="text-box">
        <p style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}><FiMapPin size={16} color="#ea580c" /> <strong>Address:</strong> Dombivli East</p>
        <p style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}><FiMail size={16} color="#ea580c" /> <strong>Email:</strong> <a href="mailto:choudharimangal0@gmail.com">choudharimangal0@gmail.com</a></p>
        <p style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}><FiPhone size={16} color="#ea580c" /> <strong>Phone/WhatsApp:</strong> <a href="https://wa.me/919892512137" target="_blank" rel="noopener noreferrer">98925 12137</a></p>
        <p style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}><FiClock size={16} color="#ea580c" /> <strong>Timings:</strong> 9 AM - 11 PM</p>
        <p>Message your order with items, quantity, and delivery date.</p>
        <div className="delivery-partners" style={{ marginTop: '24px' }}>
          <p style={{ width: '100%', fontWeight: '700', fontSize: '16px', marginBottom: '12px' }}>Also order online via:</p>
          <a href="https://www.swiggy.com/direct/brand/370609?source=swiggy-direct&subSource=generic" className="btn-swiggy" target="_blank" rel="noopener noreferrer">Swiggy</a>
          <a href="https://zomato.onelink.me/xqzv/9t209xqk" className="btn-zomato" target="_blank" rel="noopener noreferrer">Zomato</a>
        </div>
      </div>
    </>
  );
}

export default Contact;
