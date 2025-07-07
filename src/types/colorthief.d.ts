declare module 'colorthief' {
  interface ColorThief {
    /**
     * Get the dominant color from the image
     * @param img - HTML Image element
     * @param quality - 1 = best quality, 10 = good balance between speed and quality
     * @returns RGB color array [r, g, b]
     */
    getColor(img: HTMLImageElement, quality?: number): [number, number, number];
    
    /**
     * Get a palette of colors from the image
     * @param img - HTML Image element
     * @param colorCount - Number of colors to extract (2-8)
     * @param quality - 1 = best quality, 10 = good balance between speed and quality
     * @returns Array of RGB color arrays
     */
    getPalette(img: HTMLImageElement, colorCount?: number, quality?: number): [number, number, number][];
  }

  /**
   * ColorThief constructor
   */
  declare class ColorThief {
    constructor();
    getColor(img: HTMLImageElement, quality?: number): [number, number, number];
    getPalette(img: HTMLImageElement, colorCount?: number, quality?: number): [number, number, number][];
  }

  export default ColorThief;
} 