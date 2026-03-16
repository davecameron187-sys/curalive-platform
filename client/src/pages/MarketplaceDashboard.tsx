import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Download, Search, AlertCircle } from "lucide-react";

export default function MarketplaceDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"downloads" | "rating" | "recent">("downloads");

  // Fetch templates
  const { data: searchResults, isLoading: isSearching } = trpc.marketplace.searchTemplates.useQuery({
    query: searchQuery,
    category: selectedCategory || undefined,
    sortBy,
    limit: 20,
  });

  // Fetch categories
  const { data: categories } = trpc.marketplace.getCategories.useQuery();

  // Fetch featured templates
  const { data: featured } = trpc.marketplace.getFeaturedTemplates.useQuery();

  const importMutation = trpc.marketplace.importTemplate.useMutation({
    onSuccess: () => {
      // Show success message
    },
  });

  const templates = searchQuery || selectedCategory ? searchResults?.templates : featured;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">Template Marketplace</h1>
          <p className="text-lg opacity-90">
            Discover and import professionally-designed alert templates from the community
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              All Templates
            </Button>
            {categories?.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === "downloads" ? "default" : "outline"}
              onClick={() => setSortBy("downloads")}
              size="sm"
            >
              Most Downloaded
            </Button>
            <Button
              variant={sortBy === "rating" ? "default" : "outline"}
              onClick={() => setSortBy("rating")}
              size="sm"
            >
              Highest Rated
            </Button>
            <Button
              variant={sortBy === "recent" ? "default" : "outline"}
              onClick={() => setSortBy("recent")}
              size="sm"
            >
              Recently Added
            </Button>
          </div>
        </div>

        {/* Featured Section (when no search) */}
        {!searchQuery && !selectedCategory && featured && featured.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Featured Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onImport={() => importMutation.mutate({ templateId: template.id })}
                  isImporting={importMutation.isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            {searchQuery ? "Search Results" : selectedCategory ? `${selectedCategory} Templates` : "Popular Templates"}
          </h2>

          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onImport={() => importMutation.mutate({ templateId: template.id })}
                  isImporting={importMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No templates found</p>
              <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4">
                Browse All Templates
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: any;
  onImport: () => void;
  isImporting: boolean;
}

function TemplateCard({ template, onImport, isImporting }: TemplateCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg line-clamp-2">{template.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
        </div>

        {/* Category Badge */}
        <div className="mb-3">
          <Badge variant="secondary">{template.category}</Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
          <div className="text-center">
            <div className="font-semibold">{template.downloadCount}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Download className="w-3 h-3" />
              Downloads
            </div>
          </div>
          <div className="text-center">
            <div className="font-semibold flex items-center justify-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {template.averageRating.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">{template.reviewCount}</div>
            <div className="text-xs text-muted-foreground">Reviews</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onImport}
            disabled={isImporting}
            className="flex-1"
            size="sm"
          >
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            Details
          </Button>
        </div>

        {/* Details Section */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t space-y-2 text-sm">
            <div>
              <p className="font-semibold text-muted-foreground">Category</p>
              <p>{template.category}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Status</p>
              <Badge variant="outline">{template.status}</Badge>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
