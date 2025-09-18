import React from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Star,
  Wrench,
  Droplets,
  Shield,
  Users,
  Award,
  ChevronRight,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useProductStore } from '../store/product-store';
import { Loader } from '../components/ui/Loader';

export function LandingPage() {
  const { categories, getCategories, isLoading } = useProductStore();

  useEffect(() => {
    getCategories();
  }, [getCategories]);

  // Imágenes referenciales para las categorías
  const categoryImages = {
    'Griferías de Cocina': 'https://images.pexels.com/photos/1358912/pexels-photo-1358912.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'Griferías de Baño': 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'Accesorios': 'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'Repuestos': 'https://images.pexels.com/photos/1358914/pexels-photo-1358914.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'Válvulas': 'https://images.pexels.com/photos/1571461/pexels-photo-1571461.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'Duchas': 'https://images.pexels.com/photos/1358912/pexels-photo-1358912.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
  };

  // Función para obtener imagen por categoría
  const getCategoryImage = (categoryName: string) => {
    // Buscar coincidencia exacta primero
    if (categoryImages[categoryName as keyof typeof categoryImages]) {
      return categoryImages[categoryName as keyof typeof categoryImages];
    }
    
    // Buscar coincidencia parcial
    const matchingKey = Object.keys(categoryImages).find(key => 
      categoryName.toLowerCase().includes(key.toLowerCase()) || 
      key.toLowerCase().includes(categoryName.toLowerCase())
    );
    
    if (matchingKey) {
      return categoryImages[matchingKey as keyof typeof categoryImages];
    }
    
    // Imagen por defecto
    return 'https://images.pexels.com/photos/1358912/pexels-photo-1358912.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <svg 
                className="h-12 w-auto" 
                viewBox="0 0 322.72 113.36" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <style>
                  {`.st0{fill:#5D7F98;}.st1{fill:#00A2E1;}.st2{fill:#FFFFFF;}`}
                </style>
                <g>
                  <path className="st0" d="M96.97,73.43c-3.98-2.41-9.24-1.66-11.76,2.15c-0.25,0.38-0.44,0.58-0.62,0.99c0,0-0.19,0.37-0.29,0.62
                    c-3.19,7.74-14.9,14.67-26.13,14.67c-17.28,0-31.34-15.79-31.34-35.15c0-19.36,14.06-35.13,31.34-35.13
                    c11.04,0,22.19,6.49,26.07,13.85c0.45,1.02,2.21,5.46,7.74,5.63c4.46,0,8.08-3.47,8.08-7.75c0-1.2-0.31-2.33-0.82-3.35l0.02-0.01
                    C92.66,17.15,74.64,6.33,58.18,6.33c-26.06,0-47.25,22.58-47.25,50.34c0,27.77,21.2,50.35,47.25,50.35
                    c17.31,0,34.35-10.7,41.34-22.98C101.59,80.02,100.48,75.55,96.97,73.43"/>
                  <g>
                    <path className="st1" d="M94.26,46.97c0.26,0.24,0.56,0.46,0.79,0.73c2.54,2.88,4.55,5.99,5.89,9.4c0.74,1.89,0.86,3.81,0.19,5.73
                      c-0.5,1.44-1.45,2.57-3.18,3.13c-1.04,0.34-2.14,0.39-3.24,0.27c-1.3-0.13-2.52-0.48-3.44-1.3c-1.83-1.65-2.25-3.61-1.44-5.7
                      c0.43-1.11,1.14-2.15,1.83-3.18c1.67-2.5,2.77-5.12,2.57-8.04c-0.02-0.32-0.05-0.64-0.07-0.97
                      C94.19,47.01,94.22,46.99,94.26,46.97"/>
                    <path className="st2" d="M97.74,58.21c0.07,0.06,0.15,0.12,0.21,0.19c0.68,0.77,1.21,1.6,1.57,2.5c0.2,0.5,0.23,1.01,0.05,1.53
                      c-0.13,0.38-0.39,0.68-0.85,0.83c-0.28,0.09-0.57,0.1-0.86,0.07c-0.35-0.04-0.67-0.13-0.92-0.35c-0.49-0.44-0.6-0.96-0.38-1.52
                      c0.12-0.3,0.31-0.57,0.49-0.85c0.44-0.67,0.74-1.37,0.69-2.14c-0.01-0.08-0.01-0.17-0.02-0.26
                      C97.72,58.22,97.73,58.22,97.74,58.21"/>
                  </g>
                  <path className="st1" d="M59.54,74.38c-8.74,0-15.85-7.94-15.85-17.7c0-9.76,7.11-17.7,15.85-17.7c5.49,0,11.31,3.33,13.54,7.74
                    l0.35,0.75c0.22,0.48,0.19,1.04-0.1,1.48c-0.28,0.45-0.77,0.72-1.3,0.72H71c-0.54,0-1.04-0.28-1.32-0.75l-0.14-0.24
                    c-1.44-2.83-5.54-5.67-9.99-5.67c-6.51,0-11.81,6.13-11.81,13.66c0,7.53,5.3,13.66,11.81,13.66c4.37,0,8.55-2.83,10.05-5.57
                    c0.01-0.02,0.02-0.03,0.03-0.05l0.14-0.24c0.28-0.47,0.78-0.75,1.32-0.75h1.09c0.54,0,1.05,0.28,1.32,0.75
                    c0.28,0.47,0.29,1.04,0.04,1.52l-0.38,0.71C70.96,70.55,65.59,74.38,59.54,74.38"/>
                  <path className="st1" d="M142.07,74.38h-1.05c-0.66,0-1.25-0.43-1.46-1.05l-0.09-0.29l-11.89-27.02l-11.98,27.31
                    c-0.21,0.63-0.8,1.05-1.47,1.05h-1.05c-0.52,0-1-0.26-1.29-0.69c-0.29-0.43-0.34-0.98-0.13-1.46l0.29-0.66l13.79-31.38
                    c0.61-1.41,3.07-1.43,3.69,0.01l14.06,32.03c0.2,0.48,0.16,1.03-0.13,1.46C143.07,74.12,142.59,74.38,142.07,74.38"/>
                  <path className="st1" d="M191.25,74.38h-0.95c-0.85,0-1.54-0.69-1.54-1.54l-0.04-22.53l-10.37,22.88c-0.3,0.69-1.02,1.16-1.83,1.16
                    c-0.81,0-1.54-0.47-1.85-1.19l-10.39-22.85v22.53c0,0.85-0.69,1.54-1.54,1.54h-0.95c-0.85,0-1.55-0.69-1.55-1.54V41
                    c0-0.94,0.66-1.74,1.6-1.94c0.94-0.2,1.87,0.26,2.26,1.13l12.42,27.31l12.38-27.32c0.38-0.85,1.31-1.31,2.25-1.12
                    c0.94,0.2,1.6,1,1.6,1.94l0.05,31.84C192.79,73.69,192.1,74.38,191.25,74.38"/>
                  <path className="st1" d="M229.3,73.91h-13.35c-1.13,0-2.02-0.89-2.02-2.02l0.02-14.52c-0.02-0.11-0.03-0.22-0.02-0.34l0.02-0.45
                    l0.02-15.06c0-1.13,0.89-2.02,2.02-2.02l11.35-0.05c5.84,0,10.58,4.32,10.58,9.62c0,2.65-1.22,5.15-3.26,6.94
                    c3.12,1.71,5.16,4.83,5.16,8.27C239.83,69.59,235.11,73.91,229.3,73.91 M218,58.7l0.02,11.21l11.28-0.04
                    c3.58,0,6.49-2.51,6.49-5.58c0-3.08-2.91-5.58-6.49-5.58H218z M217.97,43.49l0.02,11.21l9.36-0.04c3.61,0,6.54-2.51,6.54-5.58
                    c0-3.08-2.93-5.59-6.53-5.59H217.97z"/>
                  <path className="st1" d="M261.13,74.38h-0.95c-0.85,0-1.55-0.69-1.55-1.54V40.52c0-0.85,0.69-1.54,1.55-1.54h0.95
                    c0.85,0,1.54,0.69,1.54,1.54v32.32C262.68,73.69,261.99,74.38,261.13,74.38"/>
                  <path className="st1" d="M310.25,74.38h-1.04c-0.66,0-1.25-0.43-1.46-1.05l-0.09-0.29l-11.89-27.02l-11.98,27.31
                    c-0.21,0.63-0.8,1.05-1.46,1.05h-1.05c-0.52,0-1-0.26-1.29-0.69c-0.28-0.43-0.34-0.98-0.13-1.46l0.29-0.66l13.79-31.38
                    c0.61-1.41,3.07-1.43,3.69,0.01l14.06,32.03c0.2,0.48,0.16,1.03-0.13,1.46C311.26,74.12,310.77,74.38,310.25,74.38"/>
                </g>
              </svg>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#inicio" className="text-gray-700 hover:text-primary transition-colors">Inicio</a>
              <a href="#productos" className="text-gray-700 hover:text-primary transition-colors">Productos</a>
              <a href="#servicios" className="text-gray-700 hover:text-primary transition-colors">Servicios</a>
              <a href="#nosotros" className="text-gray-700 hover:text-primary transition-colors">Nosotros</a>
              <a href="#contacto" className="text-gray-700 hover:text-primary transition-colors">Contacto</a>
              <Link to="/login">
                <Button className="ml-4">Iniciar Sesión</Button>
              </Link>
            </nav>

            <div className="md:hidden">
              <Link to="/login">
                <Button size="sm">Iniciar Sesión</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="bg-gradient-to-br from-blue-50 to-blue-100 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-in fade-in duration-700">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                Griferías y Accesorios de 
                <span className="text-primary"> Calidad Premium</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Especialistas en griferías, accesorios de baño y cocina. 
                Más de 15 años brindando soluciones de calidad para tu hogar y negocio.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/catalog">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Ver Catálogo
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  <Phone className="mr-2 h-5 w-5" />
                  Contactar Ahora
                </Button>
              </div>
            </div>
            
            <div className="animate-in fade-in duration-700" style={{ animationDelay: '200ms' }}>
              <img 
                src="https://images.pexels.com/photos/1358912/pexels-photo-1358912.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" 
                alt="Griferías de calidad" 
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Griferías Cambia?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Somos líderes en el mercado peruano ofreciendo productos de la más alta calidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-primary" />,
                title: "Garantía de Calidad",
                description: "Todos nuestros productos cuentan con garantía extendida"
              },
              {
                icon: <Users className="h-12 w-12 text-primary" />,
                title: "Atención Personalizada",
                description: "Asesoría especializada para cada proyecto"
              },
              {
                icon: <Award className="h-12 w-12 text-primary" />,
                title: "15+ Años de Experiencia",
                description: "Respaldados por años de experiencia en el mercado"
              },
              {
                icon: <Wrench className="h-12 w-12 text-primary" />,
                title: "Servicio Técnico",
                description: "Instalación y mantenimiento especializado"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow animate-in fade-in duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="productos" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nuestros Productos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Amplio catálogo de griferías y accesorios para baño y cocina
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.slice(0, 3).map((category, index) => (
                <div 
                  key={category.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow animate-in fade-in duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img 
                    src={getCategoryImage(category.name)} 
                    alt={category.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {category.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Descubre nuestra selección de {category.name.toLowerCase()} de alta calidad
                    </p>
                    <Link to="/catalog">
                      <Button variant="outline" className="w-full">
                        Ver Más
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Servicios integrales para satisfacer todas tus necesidades
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="animate-in fade-in duration-700">
              <img 
                src="https://images.pexels.com/photos/1358914/pexels-photo-1358914.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" 
                alt="Servicios profesionales" 
                className="rounded-lg shadow-lg w-full"
              />
            </div>
            
            <div className="animate-in fade-in duration-700" style={{ animationDelay: '200ms' }}>
              <div className="space-y-6">
                {[
                  {
                    icon: <Wrench className="h-8 w-8 text-primary" />,
                    title: "Instalación Profesional",
                    description: "Instalación especializada de griferías y accesorios"
                  },
                  {
                    icon: <Droplets className="h-8 w-8 text-primary" />,
                    title: "Mantenimiento",
                    description: "Servicio de mantenimiento preventivo y correctivo"
                  },
                  {
                    icon: <Users className="h-8 w-8 text-primary" />,
                    title: "Asesoría Técnica",
                    description: "Consultoría especializada para tu proyecto"
                  }
                ].map((service, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-gray-600">
                        {service.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="nosotros" className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-in fade-in duration-700">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Sobre Griferías Cambia
              </h2>
              <p className="text-xl mb-6 opacity-90">
                Somos una empresa peruana especializada en la importación y distribución 
                de griferías y accesorios de baño y cocina de la más alta calidad.
              </p>
              <p className="text-lg mb-8 opacity-80">
                Con más de 15 años en el mercado, nos hemos consolidado como líderes 
                en el sector, ofreciendo productos innovadores y un servicio excepcional 
                a nuestros clientes en todo el Perú.
              </p>
              <div className="mb-8">
                <Link to="/catalog">
                  <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                    Explorar Catálogo
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">15+</div>
                  <div className="opacity-80">Años de Experiencia</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">1000+</div>
                  <div className="opacity-80">Clientes Satisfechos</div>
                </div>
              </div>
            </div>
            
            <div className="animate-in fade-in duration-700" style={{ animationDelay: '200ms' }}>
              <img 
                src="https://images.pexels.com/photos/1571461/pexels-photo-1571461.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&fit=crop" 
                alt="Sobre nosotros" 
                className="rounded-lg shadow-lg w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Contáctanos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Estamos aquí para ayudarte con todas tus necesidades
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="animate-in fade-in duration-700">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Dirección</h3>
                    <p className="text-gray-600">
                      Av. Industrial 123, Lima, Perú
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Teléfono</h3>
                    <p className="text-gray-600">
                      +51 999 888 777
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Email</h3>
                    <p className="text-gray-600">
                      contacto@griferiascambia.com
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Horarios</h3>
                    <p className="text-gray-600">
                      Lunes a Viernes: 8:00 AM - 6:00 PM<br />
                      Sábados: 8:00 AM - 2:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="animate-in fade-in duration-700" style={{ animationDelay: '200ms' }}>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                  Envíanos un mensaje
                </h3>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo
                    </label>
                    <input 
                      type="text" 
                      className="input w-full"
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input 
                      type="email" 
                      className="input w-full"
                      placeholder="tu@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input 
                      type="tel" 
                      className="input w-full"
                      placeholder="+51 999 888 777"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje
                    </label>
                    <textarea 
                      rows={4}
                      className="input w-full resize-none"
                      placeholder="Cuéntanos cómo podemos ayudarte..."
                    />
                  </div>
                  
                  <Button className="w-full" size="lg">
                    Enviar Mensaje
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center justify-center mb-4">
                <svg 
                  className="h-8 w-auto" 
                  viewBox="0 0 322.72 113.36" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <style>
                    {`.st0{fill:#5D7F98;}.st1{fill:#00A2E1;}.st2{fill:#FFFFFF;}`}
                  </style>
                  <g>
                    <path className="st0" d="M96.97,73.43c-3.98-2.41-9.24-1.66-11.76,2.15c-0.25,0.38-0.44,0.58-0.62,0.99c0,0-0.19,0.37-0.29,0.62
                      c-3.19,7.74-14.9,14.67-26.13,14.67c-17.28,0-31.34-15.79-31.34-35.15c0-19.36,14.06-35.13,31.34-35.13
                      c11.04,0,22.19,6.49,26.07,13.85c0.45,1.02,2.21,5.46,7.74,5.63c4.46,0,8.08-3.47,8.08-7.75c0-1.2-0.31-2.33-0.82-3.35l0.02-0.01
                      C92.66,17.15,74.64,6.33,58.18,6.33c-26.06,0-47.25,22.58-47.25,50.34c0,27.77,21.2,50.35,47.25,50.35
                      c17.31,0,34.35-10.7,41.34-22.98C101.59,80.02,100.48,75.55,96.97,73.43"/>
                    <g>
                      <path className="st1" d="M94.26,46.97c0.26,0.24,0.56,0.46,0.79,0.73c2.54,2.88,4.55,5.99,5.89,9.4c0.74,1.89,0.86,3.81,0.19,5.73
                        c-0.5,1.44-1.45,2.57-3.18,3.13c-1.04,0.34-2.14,0.39-3.24,0.27c-1.3-0.13-2.52-0.48-3.44-1.3c-1.83-1.65-2.25-3.61-1.44-5.7
                        c0.43-1.11,1.14-2.15,1.83-3.18c1.67-2.5,2.77-5.12,2.57-8.04c-0.02-0.32-0.05-0.64-0.07-0.97
                        C94.19,47.01,94.22,46.99,94.26,46.97"/>
                      <path className="st2" d="M97.74,58.21c0.07,0.06,0.15,0.12,0.21,0.19c0.68,0.77,1.21,1.6,1.57,2.5c0.2,0.5,0.23,1.01,0.05,1.53
                        c-0.13,0.38-0.39,0.68-0.85,0.83c-0.28,0.09-0.57,0.1-0.86,0.07c-0.35-0.04-0.67-0.13-0.92-0.35c-0.49-0.44-0.6-0.96-0.38-1.52
                        c0.12-0.3,0.31-0.57,0.49-0.85c0.44-0.67,0.74-1.37,0.69-2.14c-0.01-0.08-0.01-0.17-0.02-0.26
                        C97.72,58.22,97.73,58.22,97.74,58.21"/>
                    </g>
                    <path className="st1" d="M59.54,74.38c-8.74,0-15.85-7.94-15.85-17.7c0-9.76,7.11-17.7,15.85-17.7c5.49,0,11.31,3.33,13.54,7.74
                      l0.35,0.75c0.22,0.48,0.19,1.04-0.1,1.48c-0.28,0.45-0.77,0.72-1.3,0.72H71c-0.54,0-1.04-0.28-1.32-0.75l-0.14-0.24
                      c-1.44-2.83-5.54-5.67-9.99-5.67c-6.51,0-11.81,6.13-11.81,13.66c0,7.53,5.3,13.66,11.81,13.66c4.37,0,8.55-2.83,10.05-5.57
                      c0.01-0.02,0.02-0.03,0.03-0.05l0.14-0.24c0.28-0.47,0.78-0.75,1.32-0.75h1.09c0.54,0,1.05,0.28,1.32,0.75
                      c0.28,0.47,0.29,1.04,0.04,1.52l-0.38,0.71C70.96,70.55,65.59,74.38,59.54,74.38"/>
                    <path className="st1" d="M142.07,74.38h-1.05c-0.66,0-1.25-0.43-1.46-1.05l-0.09-0.29l-11.89-27.02l-11.98,27.31
                      c-0.21,0.63-0.8,1.05-1.47,1.05h-1.05c-0.52,0-1-0.26-1.29-0.69c-0.29-0.43-0.34-0.98-0.13-1.46l0.29-0.66l13.79-31.38
                      c0.61-1.41,3.07-1.43,3.69,0.01l14.06,32.03c0.2,0.48,0.16,1.03-0.13,1.46C143.07,74.12,142.59,74.38,142.07,74.38"/>
                    <path className="st1" d="M191.25,74.38h-0.95c-0.85,0-1.54-0.69-1.54-1.54l-0.04-22.53l-10.37,22.88c-0.3,0.69-1.02,1.16-1.83,1.16
                      c-0.81,0-1.54-0.47-1.85-1.19l-10.39-22.85v22.53c0,0.85-0.69,1.54-1.54,1.54h-0.95c-0.85,0-1.55-0.69-1.55-1.54V41
                      c0-0.94,0.66-1.74,1.6-1.94c0.94-0.2,1.87,0.26,2.26,1.13l12.42,27.31l12.38-27.32c0.38-0.85,1.31-1.31,2.25-1.12
                      c0.94,0.2,1.6,1,1.6,1.94l0.05,31.84C192.79,73.69,192.1,74.38,191.25,74.38"/>
                    <path className="st1" d="M229.3,73.91h-13.35c-1.13,0-2.02-0.89-2.02-2.02l0.02-14.52c-0.02-0.11-0.03-0.22-0.02-0.34l0.02-0.45
                      l0.02-15.06c0-1.13,0.89-2.02,2.02-2.02l11.35-0.05c5.84,0,10.58,4.32,10.58,9.62c0,2.65-1.22,5.15-3.26,6.94
                      c3.12,1.71,5.16,4.83,5.16,8.27C239.83,69.59,235.11,73.91,229.3,73.91 M218,58.7l0.02,11.21l11.28-0.04
                      c3.58,0,6.49-2.51,6.49-5.58c0-3.08-2.91-5.58-6.49-5.58H218z M217.97,43.49l0.02,11.21l9.36-0.04c3.61,0,6.54-2.51,6.54-5.58
                      c0-3.08-2.93-5.59-6.53-5.59H217.97z"/>
                    <path className="st1" d="M261.13,74.38h-0.95c-0.85,0-1.55-0.69-1.55-1.54V40.52c0-0.85,0.69-1.54,1.55-1.54h0.95
                      c0.85,0,1.54,0.69,1.54,1.54v32.32C262.68,73.69,261.99,74.38,261.13,74.38"/>
                    <path className="st1" d="M310.25,74.38h-1.04c-0.66,0-1.25-0.43-1.46-1.05l-0.09-0.29l-11.89-27.02l-11.98,27.31
                      c-0.21,0.63-0.8,1.05-1.46,1.05h-1.05c-0.52,0-1-0.26-1.29-0.69c-0.28-0.43-0.34-0.98-0.13-1.46l0.29-0.66l13.79-31.38
                      c0.61-1.41,3.07-1.43,3.69,0.01l14.06,32.03c0.2,0.48,0.16,1.03-0.13,1.46C311.26,74.12,310.77,74.38,310.25,74.38"/>
                  </g>
                </svg>
              </div>
              <p className="text-gray-400 mb-4">
                Especialistas en griferías y accesorios de calidad premium para tu hogar.
              </p>
              <div className="flex space-x-4">
                <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Productos</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Griferías de Cocina</a></li>
                <li><a href="#" className="hover:text-white">Griferías de Baño</a></li>
                <li><a href="#" className="hover:text-white">Accesorios</a></li>
                <li><a href="#" className="hover:text-white">Repuestos</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Instalación</a></li>
                <li><a href="#" className="hover:text-white">Mantenimiento</a></li>
                <li><a href="#" className="hover:text-white">Asesoría</a></li>
                <li><a href="#" className="hover:text-white">Garantía</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Av. Industrial 123, Lima</li>
                <li>+51 999 888 777</li>
                <li>contacto@griferiascambia.com</li>
                <li>
                  <Link to="/login" className="text-primary hover:text-primary/80">
                    Portal de Clientes
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Griferías Cambia. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}