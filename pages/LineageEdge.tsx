import "./Lineage.css";
import { FC, useMemo } from "react";
import {
    EdgeLabelRenderer,
    BaseEdge,
    getSimpleBezierPath,
    Position,
} from "@xyflow/react";
import { useTheme } from ".";

interface LineageEdgeProps {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: Position;
    targetPosition: Position;
    data: { label: string; edgeColor: { dark: string; light: string } };
    markerEnd: any;
}

interface EdgeStyle {
    strokeWidth: number;
    stroke?: string;
    color?: string;
}

const edgeStyle: EdgeStyle = {
    strokeWidth: 1,
};

const LineageEdge: FC<LineageEdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
}) => {
    const { theme } = useTheme();

    const updatedEdgeStyle: EdgeStyle = { ...edgeStyle };
    const edgeColorDark = data?.edgeColor?.dark ?? "#60BB46";
    const edgeColorLight = data?.edgeColor?.light ?? "#2C457B";

    updatedEdgeStyle.color = theme === "dark" ? edgeColorDark : edgeColorLight;
    updatedEdgeStyle.stroke = theme === "dark" ? edgeColorDark : edgeColorLight;
    const markerEnd = theme === "dark" ? "url(#arrow-dark)" : "url(#arrow-light)";

    const [edgePath, labelX, labelY] = useMemo(() => {
        return getSimpleBezierPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
        });
    }, [sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition]);
    return (
        <>
            <svg>
                <defs>
                    <marker
                        id="arrow-dark"
                        markerWidth="10"
                        markerHeight="10"
                        refX="10"
                        refY="5"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path d="M0,0 L10,5 L0,10 Z" fill="#60BB46" />
                    </marker>
                    <marker
                        id="arrow-light"
                        markerWidth="10"
                        markerHeight="10"
                        refX="10"
                        refY="5"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path d="M0,0 L10,5 L0,10 Z" fill="#2C457B" />
                    </marker>
                </defs>
            </svg>
            <BaseEdge
                id={id}
                path={edgePath}
                style={updatedEdgeStyle}
                markerEnd={markerEnd}
            />
            <EdgeLabelRenderer>
                <div
                    className="edge-label-container nodrag nopan"
                    style={{
                        transform: `translate(-50%, -90%) translate(${labelX}px, ${labelY}px)`,
                    }}
                >
                    {data.label}
                </div>
            </EdgeLabelRenderer>
        </>
    );
};
export default LineageEdge;
