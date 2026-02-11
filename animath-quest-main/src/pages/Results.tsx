import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { sampleAnimes, Anime } from "@/data/sampleAnimes";

const Results = () => {
  const location = useLocation();
  const { anime1, anime2 } = location.state || {};
  
  const [results, setResults] = useState<Anime[]>([]);
  const [sortBy, setSortBy] = useState<string>("rating");
  const [order, setOrder] = useState<string>("desc");
  const [selectedAnimes, setSelectedAnimes] = useState<string[]>([]);

  useEffect(() => {
    // Simulate getting recommendations
    const recommendations = sampleAnimes.slice(0, 10);
    setResults(recommendations);
    
    if (anime1 && anime2) {
      setSelectedAnimes([anime1, anime2]);
    }
  }, [anime1, anime2]);

  const sortedResults = [...results].sort((a, b) => {
    let compareValue = 0;
    
    if (sortBy === "rating") {
      compareValue = a.rating - b.rating;
    } else if (sortBy === "popularity") {
      compareValue = a.popularity - b.popularity;
    } else if (sortBy === "year") {
      compareValue = a.year - b.year;
    }
    
    return order === "asc" ? compareValue : -compareValue;
  });

  const handleClearFilters = () => {
    setSortBy("rating");
    setOrder("desc");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Browse Anime</h1>
          
          {/* Selected Animes Display */}
          {selectedAnimes.length > 0 && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedAnimes.map((anime, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="font-medium">Anime {index + 1}:</span>
                    <Input value={anime} readOnly className="bg-background" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Filters Section */}
          <div className="mb-8 p-6 bg-card rounded-lg border shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="rating">Score</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Order</label>
                <Select value={order} onValueChange={setOrder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="desc">Desc</SelectItem>
                    <SelectItem value="asc">Asc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={handleClearFilters}>
                CLEAR SEARCH
              </Button>
              <Button>SEARCH</Button>
            </div>
          </div>
          
          {/* Results Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sortedResults.map((anime) => (
              <Card key={anime.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[3/4] overflow-hidden">
                  <img 
                    src={anime.imageUrl} 
                    alt={anime.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{anime.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-primary">★ {anime.rating}</span>
                    <span>•</span>
                    <span>{anime.year}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results. Try adjusting filters or search terms.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Results;
