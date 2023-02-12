import React, { useEffect, useState } from 'react';
import css from './index.module.scss';
import ebirds from './mock/ebirds.json';
import { Input, Button, Space } from 'antd';

const convertData = (data) => {
    const res = {
        name: "all",
        children: {},
    };
    // @ts-ignore
    data.forEach(ebird => {
        const category = ebird["CATEGORY"];
        const family = ebird["FAMILY"];
        const order = ebird["ORDER1"];
        const species = ebird["SPECIES_GROUP"];
        const primaryName = ebird["PRIMARY_COM_NAME"];
        const sciName = ebird["SCI_NAME"];
        const layers = [order, family, species];
        let cur:any = res;
        let isValid = true;
        for (const layer of layers) {
            if (!layer) {
                isValid = false;
                break;
            }
            if (!cur.children[layer])
                cur.children[layer] = {
                    name: layer,
                    children: {},
                }
            cur = cur.children[layer];
        }
        if (isValid && Object.keys(cur.children).length < 10)
            cur.children[primaryName] = {
                name: primaryName,
                size: 1,
            };
    })
    const dfs = (root) => {
        if (root["size"]) return root;
        const arr = []
        for (const child of Object.values(root.children)) {
            // @ts-ignore
            arr.push(dfs(child));
        }
        root.children = arr;
        return root;
    }
    return dfs(res);
}

const finalData = convertData(ebirds);

const getHandlers = (root, fn) => {
    const res: any[] = [];
    res.push({
        data: root,
        fn: fn,
    });
    if (!Array.isArray(root.children)) return res;
    for (const child of root.children) {
        res.push(...getHandlers(child, fn));
    }
    return res;
}

const updateD3 = (data) => {

    // @ts-ignore
    const d3 = window.d3;

    const width = window.innerWidth,
        height = window.innerHeight,
        maxRadius = (Math.min(width, height) / 2) - 5;

    const formatNumber = d3.format(',d');

    const x = d3.scaleLinear()
        .range([0, 2 * Math.PI])
        .clamp(true);

    const y = d3.scaleSqrt()
        .range([maxRadius*.1, maxRadius]);

    const color = d3.scaleOrdinal(d3.schemeCategory20);

    const partition = d3.partition();

    const arc = d3.arc()
        .startAngle(d => x(d.x0))
        .endAngle(d => x(d.x1))
        .innerRadius(d => Math.max(0, y(d.y0)))
        .outerRadius(d => Math.max(0, y(d.y1)));

    const middleArcLine = d => {
        const halfPi = Math.PI/2;
        const angles = [x(d.x0) - halfPi, x(d.x1) - halfPi];
        const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);

        const middleAngle = (angles[1] + angles[0]) / 2;
        const invertDirection = middleAngle > 0 && middleAngle < Math.PI; // On lower quadrants write text ccw
        if (invertDirection) { angles.reverse(); }

        const path = d3.path();
        path.arc(0, 0, r, angles[0], angles[1], invertDirection);
        return path.toString();
    };

    const textFits = d => {
        const CHAR_SPACE = 6;

        const deltaAngle = x(d.x1) - x(d.x0);
        const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);
        const perimeter = r * deltaAngle;

        return d.data.name.length * CHAR_SPACE < perimeter;
    };

    d3.selectAll('svg').remove();
    const svg = d3.select('.d3Svg').append('svg')
        .style('width', '80vw')
        .style('height', '100vh')
        .attr('viewBox', `${-width / 2} ${-height / 2} ${width} ${height}`)
        .on('click', () => focusOn()); // Reset zoom on canvas click

    let root = data;
    root = d3.hierarchy(root);
    const handlers = getHandlers(root, focusOn);
    root.sum(d => d.size);

    const slice = svg.selectAll('g.slice')
        .data(partition(root).descendants());

    slice.exit().remove();

    const tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .style("border", "1px solid black")
        .style("background", "rgba(255,255,255,0.8)")
        .style("font-weight", "bold")
        .style("font-size", "16px")
        .text("a simple tooltip");

    const newSlice = slice.enter()
        .append('g').attr('class', 'slice')
        .on('click', d => {
            d3.event.stopPropagation();
            focusOn(d);
        })
        .on("mouseover", function(d){
            // @ts-ignore
            d3.select(this).transition()
               .duration('50')
               .attr('opacity', '.85');
            tooltip.text(`Primary Name: ${d.data.name}`);
            return tooltip.style("visibility", "visible");
        })
        .on("mousemove", function(){
            return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
        })
        .on("mouseout", function(){
            // @ts-ignore
            d3.select(this).transition()
                .duration('50')
                .attr('opacity', '1');
            return tooltip.style("visibility", "hidden");
        });

    newSlice.append('title')
        .text(d => d.data.name + '\n' + formatNumber(d.value));

    newSlice.append('path')
        .attr('class', 'main-arc')
        .style('fill', d => color((d.children ? d : d.parent).data.name))
        .attr('d', arc);

    newSlice.append('path')
        .attr('class', 'hidden-arc')
        .attr('id', (_, i) => `hiddenArc${i}`)
        .attr('d', middleArcLine);

    const text = newSlice.append('text')
        .attr('display', d => textFits(d) ? null : 'none');

    // Add white contour
    text.append('textPath')
        .attr('startOffset','50%')
        .attr('xlink:href', (_, i) => `#hiddenArc${i}` )
        .text(d => d.data.name)
        .style('fill', 'none')
        .style('stroke', '#fff')
        .style('stroke-width', 5)
        .style('stroke-linejoin', 'round');

    text.append('textPath')
        .attr('startOffset','50%')
        .attr('xlink:href', (_, i) => `#hiddenArc${i}` )
        .text(d => d.data.name);

    function focusOn(d = { x0: 0, x1: 1, y0: 0, y1: 1 }) {
        // Reset to top-level if no data point specified

        const transition = svg.transition()
            .duration(750)
            .tween('scale', () => {
                const xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                    yd = d3.interpolate(y.domain(), [d.y0, 1]);
                return t => { x.domain(xd(t)); y.domain(yd(t)); };
            });

        transition.selectAll('path.main-arc')
            .attrTween('d', d => () => arc(d));

        transition.selectAll('path.hidden-arc')
            .attrTween('d', d => () => middleArcLine(d));

        transition.selectAll('text')
            .attrTween('display', d => () => textFits(d) ? null : 'none');

        moveStackToFront(d);

        //

        function moveStackToFront(elD) {
            svg.selectAll('.slice').filter(d => d === elD)
                .each(function(d) {
                    // @ts-ignore
                    this.parentNode.appendChild(this);
                    if (d.parent) { moveStackToFront(d.parent); }
                })
        }
    }

    return handlers;
}

function App() {
    useEffect(() => {
        setHandlers(updateD3(finalData));
    }, []);

    const [input, setInput] = useState("");

    const [handlers, setHandlers] = useState<any>([]);
    console.log('render');
    
    return (
        <div className={css.root}>
            <div className={css.searchBar}>
                <Space direction="vertical">
                    <h3>EBird Taxonomy Checklist</h3>
                    <Input placeholder='search for a species...' value={input} onChange={e => {setInput(e.target.value)}}></Input>
                    <Button type="primary" onClick={e => handlers[0].fn(handlers[0].data)}>back to root</Button>
                    {handlers.map((handler, index) => {
                        if (index == 0) return null;
                        if (input != "" && handler?.data?.data?.name && handler?.data?.data?.name.toLowerCase().startsWith(input.toLowerCase()))
                            return (
                                <Button key={index} onClick={e => handler.fn(handler.data)}>{handler.data.data.name}</Button>
                            )
                        else return null;
                    })}
                </Space>
            </div>
            <div className="d3Svg"></div>
        </div>
    );
}

export default App;
