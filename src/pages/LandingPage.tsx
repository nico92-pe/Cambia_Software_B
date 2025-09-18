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
              <img 
                src="https://images.pexels.com/photos/1117452/pexels-photo-1117452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" 
                alt="Griferías Cambia" 
                className="h-10 w-10 rounded-full mr-3"
              />
              <h1 className="text-2xl font-bold text-primary">Griferías Cambia</h1>
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
              <div className="flex items-center mb-4">
                <img 
                  src="https://images.pexels.com/photos/1117452/pexels-photo-1117452.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" 
                  alt="Griferías Cambia" 
                  className="h-8 w-8 rounded-full mr-2"
                />
                <h3 className="text-xl font-bold">Griferías Cambia</h3>
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