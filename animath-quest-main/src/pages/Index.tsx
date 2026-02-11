import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { sampleAnimes } from "@/data/sampleAnimes";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [anime1, setAnime1] = useState<string>("");
  const [anime2, setAnime2] = useState<string>("");

  const handleSearch = () => {
    if (!anime1 || !anime2) {
      toast.error("Please select both anime before searching");
      return;
    }
    
    // Send to backend (placeholder for now)
    console.log("Sending to backend:", { anime1, anime2 });
    
    // Navigate to results page
    navigate("/results", { state: { anime1, anime2 } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-hero relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[calc(100vh-180px)]">
          <h1 className="text-7xl md:text-8xl font-bold text-brand-dark mb-4">
            AniMatch
          </h1>
          <p className="text-2xl md:text-3xl text-brand-dark font-medium mb-12">
            Find animes that match your liking!
          </p>
          
          <div className="w-full max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select value={anime1} onValueChange={setAnime1}>
                  <SelectTrigger className="w-full h-14 text-base bg-white border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <SelectValue placeholder="What is an anime you like?" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {sampleAnimes.map((anime) => (
                      <SelectItem key={anime.id} value={anime.name}>
                        {anime.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={anime2} onValueChange={setAnime2}>
                  <SelectTrigger className="w-full h-14 text-base bg-white border-2 border-primary/20 hover:border-primary/40 transition-colors">
                    <SelectValue placeholder="What is another anime you like?" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {sampleAnimes.map((anime) => (
                      <SelectItem key={anime.id} value={anime.name}>
                        {anime.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleSearch}
                size="lg"
                className="px-12 py-6 text-lg font-semibold rounded-full"
              >
                SEARCH
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
