import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  comment: string;
  avatar?: string;
  service: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Marie Kabila',
    location: 'Ngaliema',
    rating: 5,
    comment: 'J\'ai économisé plus de 50,000 CDF ce mois grâce à TAGA. Service rapide et fiable !',
    service: 'VTC'
  },
  {
    name: 'Jean Mutombo',
    location: 'Gombe',
    rating: 5,
    comment: 'En tant que chauffeur, je gagne maintenant 180,000 CDF par mois. Merci TAGA !',
    service: 'Chauffeur'
  },
  {
    name: 'Grace Tshala',
    location: 'Lemba',
    rating: 5,
    comment: 'Livraison ultra rapide et prix abordables. Je recommande à 100% !',
    service: 'Livraison'
  },
  {
    name: 'Patrick Nkulu',
    location: 'Bandalungwa',
    rating: 5,
    comment: 'Marketplace avec de vrais produits congolais. C\'est ce qu\'on attendait !',
    service: 'Marketplace'
  }
];

export const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const previousTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const currentTestimonial = TESTIMONIALS[currentIndex];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ils ont déjà profité de l'offre
          </h2>
          <p className="text-lg text-muted-foreground">
            Plus de 12,000+ utilisateurs satisfaits à travers la RDC
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="bg-card rounded-3xl p-8 md:p-12 shadow-lg border border-border"
              >
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={currentTestimonial.avatar} />
                    <AvatarFallback className="text-2xl">
                      {currentTestimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex mb-4">
                    {[...Array(currentTestimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-xl md:text-2xl mb-6 italic text-foreground">
                    "{currentTestimonial.comment}"
                  </p>

                  <div>
                    <p className="font-bold text-lg">{currentTestimonial.name}</p>
                    <p className="text-muted-foreground">{currentTestimonial.location}</p>
                    <p className="text-sm text-primary mt-1">{currentTestimonial.service}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <Button
              variant="outline"
              size="icon"
              onClick={previousTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 rounded-full"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 rounded-full"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
