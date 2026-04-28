// Dictionary for translations
const translations = {
    en: {
        't-nav-home': 'Home',
        't-nav-about': 'Meet Patty',
        't-nav-menu': 'Our Cakes',
        't-nav-reviews': 'Reviews',
        't-nav-contact': 'Contact',
        't-hero-title': 'Authentic Latin Flavors',
        't-hero-subtitle': 'Crafted into Every Cake and Pastry.',
        't-hero-btn': 'Order on Toast',
        't-about-title': 'Meet the Owner: Patty Guzman',
        't-about-p1': 'Patty, the proud owner of Lolly’s Bakery, began her journey in the small countryside of Jalisco, Mexico, where she grew up surrounded by the sounds of chickens and the dreams of her family.',
        't-about-p2': 'At just 12 years old, Patty made the courageous journey to the United States, carrying with her the hope and determination her parents had planted in her heart. She grew up embracing hard work, following harvests alongside her family, and dreaming of a brighter future.',
        't-about-p3': 'With grit and an unwavering connection to her roots, Patty turned her love for baking and her Latin heritage into Lolly’s Bakery—a thriving business. Lolly’s Bakery celebrates Latin American flavors, community, and the power of perseverance. From her humble beginnings to now, Patty’s story inspires generations to follow their dreams and believe in the possibilities born from hard work and tradition.',
        't-menu-title': 'Our Custom Cakes',
        't-item1-title': 'Floral Forest',
        't-item1-desc': 'Enjoy the goodness of frosted flowers and layers of perfection.',
        't-item2-title': 'Purple Frosted Delight',
        't-item2-desc': 'An elegant white cake adorned with delicate purple flowers.',
        't-item3-title': 'Under the Sea',
        't-item3-desc': 'Dive into a magical \'Under the Sea\' cake, featuring ocean blues, seashells, and sea creatures!',
        't-reviews-title': 'Customer Reviews',
        't-review1-text': '"Very friendly staff. They provided great assistance when I was ordering my son’s first birthday cake. The cake was beautifully decorated and the tres leches cake was absolutely delicious! We will regularly order all of our future, family birthday cakes from Lolly’s!"',
        't-review1-author': '- Jacqueline G.',
        't-review2-text': '"I just visited Lolly’s bakery for the first time to pick up a Tres leches cake for my wife’s birthday. It’s a cozy little shop with a great neighborhood feel. The staff were very helpful and accommodating. It’s also worth mentioning that the place is so spotlessly clean, you can practically eat off of the floor. I highly recommend."',
        't-review2-author': '- Anonymous',
        't-review3-text': '"The sweetest little bakery in Eastie. This is one of those places that helps define the community. Open early in the morning serving fresh breads, pastries, and unassuming coffee- Lolly\'s feeds the neighborhood and is well loved in return."',
        't-review3-author': '- Israel S.',
        't-form-title': 'Send us a Message',
        't-form-name': 'Name',
        't-form-email': 'Email',
        't-form-message': 'Message',
        't-form-submit': 'Send Message',
        't-footer-tagline': 'We offer both delivery and pickup services!',
        't-footer-visit': 'Locations',
        't-footer-contact': 'Contact Us'
    },
    es: {
        't-nav-home': 'Inicio',
        't-nav-about': 'Conoce a Patty',
        't-nav-menu': 'Nuestros Pasteles',
        't-nav-reviews': 'Reseñas',
        't-nav-contact': 'Contacto',
        't-hero-title': 'Sabores Latinos Auténticos',
        't-hero-subtitle': 'Elaborados en cada pastel y repostería.',
        't-hero-btn': 'Ordena en Toast',
        't-about-title': 'Conoce a la Dueña: Patty Guzman',
        't-about-p1': 'Patty, la orgullosa dueña de Lolly’s Bakery, comenzó su viaje en el pequeño campo de Jalisco, México, donde creció rodeada de los sonidos de las gallinas y los sueños de su familia.',
        't-about-p2': 'A sus 12 años, Patty emprendió el valiente viaje a los Estados Unidos, llevando consigo la esperanza y determinación que sus padres habían plantado en su corazón. Creció abrazando el trabajo duro, siguiendo cosechas junto a su familia y soñando con un futuro brillante.',
        't-about-p3': 'Con determinación y una conexión inquebrantable a sus raíces, Patty convirtió su amor por la panadería y su herencia latina en Lolly’s Bakery, un negocio próspero. Lolly’s Bakery celebra los sabores latinoamericanos, la comunidad y el poder de la perseverancia. Desde sus humildes comienzos hasta ahora, la historia de Patty inspira a generaciones a seguir sus sueños.',
        't-menu-title': 'Nuestros Pasteles Personalizados',
        't-item1-title': 'Bosque Floral',
        't-item1-desc': 'Disfruta de la bondad de las flores glaseadas y capas de perfección.',
        't-item2-title': 'Delicia Púrpura',
        't-item2-desc': 'Un elegante pastel blanco adornado con delicadas flores púrpuras.',
        't-item3-title': 'Bajo el Mar',
        't-item3-desc': '¡Sumérgete en un mágico pastel "Bajo el Mar", con azules del océano, conchas y criaturas marinas!',
        't-reviews-title': 'Reseñas de Clientes',
        't-review1-text': '"Personal muy amable. Me brindaron una gran asistencia cuando estaba ordenando el pastel para el primer cumpleaños de mi hijo. ¡El pastel estaba hermosamente decorado y el pastel de tres leches estaba absolutamente delicioso! Ordenaremos regularmente de Lolly\'s."',
        't-review1-author': '- Jacqueline G.',
        't-review2-text': '"Acabo de visitar la panadería de Lolly por primera vez para recoger un pastel de Tres leches. Es una pequeña tienda acogedora con un gran ambiente de vecindario. El personal fue muy servicial. Vale la pena mencionar que el lugar está tan impecablemente limpio que prácticamente puedes comer del suelo. Lo recomiendo mucho."',
        't-review2-author': '- Anónimo',
        't-review3-text': '"La panadería más dulce en Eastie. Este es uno de esos lugares que ayuda a definir a la comunidad. Abierto temprano en la mañana sirviendo panes frescos, repostería y café modesto; Lolly\'s alimenta al vecindario y es muy amado a cambio."',
        't-review3-author': '- Israel S.',
        't-form-title': 'Envíanos un Mensaje',
        't-form-name': 'Nombre',
        't-form-email': 'Correo Electrónico',
        't-form-message': 'Mensaje',
        't-form-submit': 'Enviar Mensaje',
        't-footer-tagline': '¡Ofrecemos servicios de entrega y recogida!',
        't-footer-visit': 'Ubicaciones',
        't-footer-contact': 'Contáctanos'
    }
};

// Language Toggle Logic
const btnEn = document.getElementById('lang-en');
const btnEs = document.getElementById('lang-es');

function setLanguage(lang) {
    // Update active button
    if (lang === 'en') {
        btnEn.classList.add('active');
        btnEs.classList.remove('active');
    } else {
        btnEs.classList.add('active');
        btnEn.classList.remove('active');
    }

    // Update text content
    const dict = translations[lang];
    for (const key in dict) {
        const elements = document.getElementsByClassName(key);
        for (let i = 0; i < elements.length; i++) {
            // Handle specific cases like inputs/buttons
            if (elements[i].tagName === 'INPUT' && elements[i].type === 'submit' || elements[i].tagName === 'BUTTON') {
                elements[i].textContent = dict[key];
            } else {
                elements[i].textContent = dict[key];
            }
        }
    }
}

btnEn.addEventListener('click', () => setLanguage('en'));
btnEs.addEventListener('click', () => setLanguage('es'));

// Scroll Reveal Animation
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.menu-card, .about-container, .review-card, .contact-form-wrapper').forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
});
