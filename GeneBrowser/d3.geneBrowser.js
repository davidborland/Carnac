/*
 * Copyright (c) 2013  Renaissance Computing Institute. All rights reserved.
 *
 * This software is open source. See the bottom of this file for the license.
 *
 * Renaissance Computing Institute,
 * (A Joint Institute between the University of North Carolina at Chapel Hill,
 * North Carolina State University, and Duke University)
 * http://www.renci.org
 *
 * For questions, comments please contact software@renci.org
 *
 */

(function() {
  d3.geneBrowser = function() {
        // Size
    var margin = { top: 10, left: 5, bottom: 10, right: 5 },
        width = 200,
        height = 200,
        innerWidth = function() { return width - margin.left - margin.right; },
        innerHeight = function() { return height - margin.top - margin.bottom; },
  
        // Data
        data = [],
        geneRegions = [],
                
        // Parameters
        geneMapping = "height",
        geneHeight = 30,
        transcriptHeight = 5,
        spacing = 10,
//        geneTranscriptSpacing = 2 * spacing,
        geneTranscriptSpacing = geneHeight / 2,
        showTranscripts = true,
        cornerRadius = 2,
                
        // Scales
        xScale = d3.scale.linear(),
        yScale = d3.scale.linear(),
        geneHeightScale = d3.scale.linear(),
        geneColorScale = d3.scale.linear(),
        transcriptHeightScale = d3.scale.ordinal()
            .domain(["UTR-5", "UTR-3", "UTR", "intron", "exon"]),
        transcriptColorScale = d3.scale.ordinal()
            .domain(["UTR-5", "UTR-3", "UTR", "intron", "exon"])
            .range(["darkgrey", "darkgrey", "darkgrey", "lightgrey", "grey"]),
            
        // Start with empty selections
        svg = d3.select(),
        g = d3.select();
  
    // Create a closure
    function gb(selection) {
      selection.each(function(d) {
        // Set the data
        data = d;    
        
        // Select the svg element, if it exists
        svg = d3.select(this).selectAll("svg").data([data]);
  
        // Otherwise create the skeletal chart
        g = svg.enter().append("svg").append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
        // Set scales
        var minX = data.transcripts.reduce(function(p, c) {
          var v = c.regions[0].start;
          return v < p ? v : p;
        }, data.transcripts[0].regions[0].start);
        
        var maxX = data.transcripts.reduce(function(p, c) {
          var v = c.regions[c.regions.length - 1].stop;
          return v > p ? v : p;
        }, 1);
        
        xScale.domain([minX, maxX]);
        yScale.domain([0, data.transcripts.length]);
        geneHeightScale.domain([0, data.transcripts.length]);
        geneColorScale.domain([0, data.transcripts.length]);
        
        // Add groups for gene and transcripts
        g.append("g")
            .attr("id", "transcriptGroup");
        g.append("g")
            .attr("id", "geneGroup")
          .append("rect")
            .attr("id", "geneBorder")
            .style("fill", "none")
            .style("stroke", "grey");
         
        // Set the width and height
        setWidth(width);
        computeHeight();
        
        // Draw the gene and transcripts
        generateGeneData();          
        drawGene();
        
        // Register callbacks
        dispatch.on("select_variant.variantBrowser", selectVariant);
      });
    }
    
    function generateGeneData() {
      // Get the start and stop locations for all exons
      var geneData = [];
      data.transcripts.forEach(function(d) {
        d.regions.forEach(function(d) {
          if (d.type === "exon") {
            geneData.push({ loc: "start", pos: d.start });
            geneData.push({ loc: "stop", pos: d.stop });
          }
        });
      });
            
      // Sort the start and stop locations
      geneData.sort(function(a, b) { return d3.ascending(a.pos, b.pos); });
      
      // Generate data for rendering
      geneRegions = [];
      var h = 0,
          p0 = xScale.domain()[0];
      for (var i = 0; i < geneData.length; i++) {        
        var p1 = geneData[i].pos;
        if (p1 != p0) {
          geneRegions.push({ start: p0, stop: p1, height: h });
          p0 = p1;
        }
        geneData[i].loc === "start" ? h++ : h--;      
      }
      geneRegions.push({ start: p0, stop: xScale.domain()[1], height: h });
    }
    
    function computeHeight(transitionTime) {
      if (!transitionTime) transitionTime = 0;
      
//      geneTranscriptSpacing = 2 * spacing;
      geneTranscriptSpacing = geneHeight / 2;
      
      // Compute height
      height = geneHeight + geneTranscriptSpacing + (transcriptHeight + spacing) * data.transcripts.length + transcriptHeight + margin.top + margin.bottom;      
      
      // Set svg height
      svg.attr("height", height);
      
      // Move groups
      g.select("#geneGroup").transition().duration(transitionTime).attr("transform", "translate(0," + geneHeight / 2 + ")");
      g.select("#transcriptGroup").transition().duration(transitionTime).attr("transform", "translate(0," + (geneHeight + geneTranscriptSpacing + transcriptHeight / 2) + ")");
            
      // Update scales
      yScale.range([0, innerHeight() - geneHeight - geneTranscriptSpacing - transcriptHeight / 2]);
      geneHeightScale.range(geneMapping === "color" ? [geneHeight, geneHeight] : [1, geneHeight]);
      geneColorScale.range(geneMapping === "height" ? ["grey", "grey"] : [d3.rgb(225, 225, 225), d3.rgb(0, 0, 0)]);     
      transcriptHeightScale.range([3, 3, 3, 1, transcriptHeight]);
    }
    
    function drawGene(transitionTime) { 
      if (!transitionTime) transitionTime = 0;
      
      // Draw gene      
      var gGene = g.select("#geneGroup");
            
      var geneRegion = gGene.selectAll(".region")
          .data(geneRegions);
        
      geneRegion.enter().append("rect")
          .attr("class", "region");
  
      geneRegion.transition()
          .duration(transitionTime)
          .attr("x", function(d) { return xScale(d.start); })
          .attr("y", function(d) { return -geneHeightScale(d.height) / 2; })
//.attr("y", function(d) { return geneHeight / 2 - geneHeightScale(d.height); })
          .attr("rx", cornerRadius)
          .attr("ry", cornerRadius)
          .attr("width", function(d) { return xScale(d.stop) - xScale(d.start); })
          .attr("height", function(d) { return geneHeightScale(d.height); })
          .style("fill", function(d) { return geneColorScale(d.height); }); 
      
      // Show gene border or not based on gene mapping type
      gGene.select("#geneBorder").transition()
          .duration(transitionTime)
          .attr("x", -1)
          .attr("y", -geneHeight / 2)
          .attr("width", xScale.range()[1] + 2)
          .attr("height", geneHeight)
          .style("stroke", "lightgrey")
          .style("stroke-width", 1)
          .style("stroke-opacity", geneMapping === "color" ? 0 : 1); 
      
      
      // Draw transcripts
      if (showTranscripts) {        
        var transcript = g.select("#transcriptGroup").selectAll(".transcript")
            .data(data.transcripts);

        transcript.enter().append("g")
            .attr("class", "transcript");

        transcript.transition()
            .duration(transitionTime)
            .attr("transform", function(d, i) { return "translate(0," + yScale(i) + ")"; })
            .style("fill-opacity", 1);

        var transcriptRegion = transcript.selectAll(".region")
            .data(function(d) { return d.regions; });

        transcriptRegion.enter().append("rect")
            .attr("class", "region")
            .style("fill", function(d) { return transcriptColorScale(d.type); });

        transcriptRegion.transition()
            .duration(transitionTime)
            .attr("x", function(d) { return xScale(d.start); })
            .attr("y", function(d) { return -transcriptHeightScale(d.type) / 2; })
            .attr("rx", cornerRadius)
            .attr("ry", cornerRadius)
            .attr("width", function(d) { return xScale(d.stop) - xScale(d.start); })
            .attr("height", function(d) { return transcriptHeightScale(d.type); });
      }
/*      
      // Variant glyphs
      var gVariant = g.selectAll(".variant")
          .data(data)
        .enter().append("g")
          .attr("class", "variant")
          .attr("transform", function(d, i) { return "translate(0," + yScale(i) + ")"; })
          .on("mouseover", function(d) { 
            if (!d.selected) {
              // Highlight rectangle
              d3.select(this).select("rect")              
                  .attr("visibility", "visible");
            }
          })
          .on("mouseout", function(d) {
            if (!d.selected) {           
              // Hide rectangle
              d3.select(this).select("rect")
                  .attr("visibility", "hidden");
            }
          })
          .on("click", function(d) {            
            // Fire callbacks
            // XXX: Should pass dispatch object instead of using global reference?
            dispatch.select_variant(d); 
          }); 
    
      // Background
      gVariant.append("rect")
          .attr("class", "background")
          .attr("x", -margin.left + 1)
          .attr("y", -(glyphSize + glyphSpacing) / 2)
          .attr("height", glyphSize + glyphSpacing)
          .attr("width", width - 2)
          .attr("visibility", "hidden")
          .attr("pointer-events", "fill")
          .style("fill", "#eee")
          .style("stroke", "none");
      
      // Label
      gVariant.append("text")
          .text(function(d) { return d.geneName; })
          .attr("dy", "0.35em")
          .style("font-size", "small");
      
      // Glyph
      gVariant.append("g")
          .attr("transform", "translate(" + (maxNameLength + glyphSize) + ",0)")
        .append("path")
          .attr("d", d3.svg.symbol()
                         .size(Math.pow(glyphSize, 2))
                         .type(function(d) { return shapeScale(d.type); }))
          .style("fill", function(d, i) { return colorScale(d.class ? d.class : "null"); })
          .style("stroke", "black")
          .style("stroke-width", 0.25);
      
      // Frequency bars
      gVariant.append("rect")
          .attr("class", "frequency f1")
          .attr("x", maxNameLength + glyphSize * 2)
          .attr("y", -glyphSize / 2)
          .attr("height", glyphSize / 2 - 0.5)
          .attr("width", function(d) { return frequencyScale(frequencyToLog(d.ncgFreq)); })
          .style("fill", function(d) { return frequencyColor(frequencyToLog(d.ncgFreq)); })
          .style("stroke", "none");
      
      gVariant.append("rect")
          .attr("class", "frequency f2")
          .attr("x", maxNameLength + glyphSize * 2)
          .attr("y", 0.5)
          .attr("height", glyphSize / 2 - 0.5)
          .attr("width", function(d) { return frequencyScale(frequencyToLog(d.tgFreq)); })
          .style("fill", function(d) { return frequencyColor(frequencyToLog(d.tgFreq)); })
          .style("stroke", "none");
      
      // Selected border
      // Put here so it is always on top
      g.append("rect")
          .attr("x", -margin.left + 1)
          .attr("class", "selectborder")
          .attr("height", glyphSize + glyphSpacing)
          .attr("width", width - 2)
          .attr("visibility", "hidden")
          .attr("pointer-events", "none")
          .style("fill", "none")
          .style("stroke", "black");
*/      
    }
    
    function selectVariant(variant) {
      
/*      
      // Select variants
      var gVariant = g.selectAll(".variant");
      
      // Hide previous rectangle
      gVariant.select("rect")
          .attr("visibility", "hidden");
      
      // Show this rectangle
      gVariant.filter(function(d) { return d === variant; }).select("rect")
          .attr("visibility", "visible");
      
      // Make selected border visible and move it
      g.select(".selectborder")
          .attr("visibility", "visible")
 //         .attr("y", yScale(i) - (glyphSize + glyphSpacing) / 2);
          .attr("y", yScale(data.indexOf(variant)) - (glyphSize + glyphSpacing) / 2);
      
      // Unselect variant
      // XXX: Could improve performance by storing selected index/name...
      data.forEach(function(d) { d.selected = false; });           
      
      // Save selected data
      variant.selected = true;
*/      
    }
    
    function setWidth(_) {
      width = _;  
      svg.attr("width", width);
      
      xScale.range([0, innerWidth()]);
/*      
      frequencyScale.range([Math.max(innerWidth() - maxNameLength - glyphSize * 2, 0), 0]);
      
      var duration = 750;
      g.selectAll(".background").transition()
          .duration(duration)
          .attr("width", width - 2);
      
      g.selectAll(".frequency.f1").transition()
          .duration(duration)
          .attr("width", function(d) { return frequencyScale(frequencyToLog(d.ncgFreq)); });
      
      g.selectAll(".frequency.f2").transition()
          .duration(duration)
          .attr("width", function(d) { return frequencyScale(frequencyToLog(d.tgFreq)); });      
          
      g.select(".selectborder").transition()
          .duration(duration)
          .attr("width", width - 2);
*/      
    }
    
    // Accessor functions      
    gb.width = function(_) {
      if (!arguments.length) return width;  
      setWidth(_);      
      return gb;
    };
    
    gb.geneMapping = function(_) {
      if (!arguments.length) return geneMapping;
      geneMapping = _;
      var transitionTime = 500;
      computeHeight(transitionTime);       
      drawGene(transitionTime);
      return gb;
    };
    
    gb.geneHeight = function(_) {
      if (!arguments.length) return geneHeight;
      geneHeight = _;    
      computeHeight();      
      drawGene();
      return gb;
    };
    
    gb.transcriptHeight = function(_) {
      if (!arguments.length) return transcriptHeight;
      transcriptHeight = _;    
      computeHeight();      
      drawGene();
      return gb;
    };
    
    gb.spacing = function(_) {
      if (!arguments.length) return spacing;
      spacing = _;    
      computeHeight();      
      drawGene();
      return gb; 
    }
    
    gb.showTranscripts = function(_) {
      if (!arguments.length) return showTranscripts;
      showTranscripts = _;
      var transitionTime = 500;
      if (showTranscripts) {
        drawGene(transitionTime);            
      }
      else { 
        g.select("#transcriptGroup").selectAll(".transcript").transition()
            .duration(transitionTime)
            .attr("transform", "translate(0," + (-(geneHeight / 2 + geneTranscriptSpacing + transcriptHeight / 2)) + ")")
            .style("fill-opacity", 0);
            //.attr("transform", "translate(0,-50)")
            //.attr("visibility", "hidden");
      }
    }
    
    gb.cornerRadius = function(_) {
      if (!arguments.length) return cornerRadius;
      cornerRadius = _;   
      drawGene();
    }
    
    // Return closure
    return gb;
  };
})();

/*
RENCI Open Source Software License
The University of North Carolina at Chapel Hill

The University of North Carolina at Chapel Hill (the "Licensor") through
its Renaissance Computing Institute (RENCI) is making an original work of
authorship (the "Software") available through RENCI upon the terms set
forth in this Open Source Software License (this "License").  This License
applies to any Software that has placed the following notice immediately
following the copyright notice for the Software:  Licensed under the RENCI
Open Source Software License v. 1.0.

Licensor grants You, free of charge, a world-wide, royalty-free,
non-exclusive, perpetual, sublicenseable license to do the following to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

. Redistributions of source code must retain the above copyright notice,
this list of conditions and the following disclaimers.

. Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimers in the
documentation and/or other materials provided with the distribution.

. Neither You nor any sublicensor of the Software may use the names of
Licensor (or any derivative thereof), of RENCI, or of contributors to the
Software without explicit prior written permission.  Nothing in this
License shall be deemed to grant any rights to trademarks, copyrights,
patents, trade secrets or any other intellectual property of Licensor
except as expressly stated herein.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE CONTIBUTORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

You may use the Software in all ways not otherwise restricted or
conditioned by this License or by law, and Licensor promises not to
interfere with or be responsible for such uses by You.  This Software may
be subject to U.S. law dealing with export controls.  If you are in the
U.S., please do not mirror this Software unless you fully understand the
U.S. export regulations.  Licensees in other countries may face similar
restrictions.  In all cases, it is licensee's responsibility to comply
with any export regulations applicable in licensee's jurisdiction.
 ****************************************************************************/