import { Composition, Still } from "remotion";
import { StructureFrame } from "./StructureFrame";
import { EntityFrame } from "./EntityFrame";
import { WikiFrame } from "./WikiFrame";
import { KnowledgeJourney } from "./KnowledgeJourney";
import { QueryJourney } from "./QueryJourney";
import { QueryOpeningV2 } from "./QueryOpeningV2";
import { QueryOpeningV3 } from "./QueryOpeningV3";
import { QueryOpeningV4, V4_DURATION } from "./QueryOpeningV4";
import { QuerySearch } from "./QuerySearch";
import { InputBoxStyle } from "./InputBoxStyle";
import { V2_DURATION } from "./query-v2-motion";
import { SEARCH_DURATION } from "./query-search-motion";
import { INGEST_DURATION, QUERY_DURATION } from "./journey-motion";
import { RetrievalContinuum } from "./RetrievalContinuum";
import { MindVoyage } from "./MindVoyage";
import { Opening } from "./Opening";
import { OPENING_DURATION } from "./opening-motion";
import { PaperFrontierGraybox } from "./paper-frontier/opening/Graybox";
import {
  PaperPosterFall,
  PaperPosterLedge,
  PaperPosterMount,
  PaperPosterThreshold,
} from "./paper-frontier/opening/Posters";

export const ProjectCompositions = () => (
  <>
    <Composition
      id="PaperFrontierGraybox"
      component={PaperFrontierGraybox}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={360}
    />
    <Still
      id="PaperPoster01Ledge"
      component={PaperPosterLedge}
      width={1920}
      height={1080}
    />
    <Still
      id="PaperPoster02Fall"
      component={PaperPosterFall}
      width={1920}
      height={1080}
    />
    <Still
      id="PaperPoster03Mount"
      component={PaperPosterMount}
      width={1920}
      height={1080}
    />
    <Still
      id="PaperPoster04Threshold"
      component={PaperPosterThreshold}
      width={1920}
      height={1080}
    />
    <Composition
      id="TitleOpening"
      component={Opening}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={OPENING_DURATION * 60}
    />
    <Composition
      id="MindVoyage"
      component={MindVoyage}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={40 * 60}
    />
    <Composition
      id="HarnessRagContinuum"
      component={RetrievalContinuum}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={68 * 60}
      defaultProps={{ startAt: 0 }}
    />
    <Composition
      id="RetrievalEnding"
      component={RetrievalContinuum}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={20 * 60}
      defaultProps={{ startAt: 48 }}
    />
    <Composition
      id="KnowledgeJourney"
      component={KnowledgeJourney}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={INGEST_DURATION * 60}
    />
    <Composition
      id="QueryJourney"
      component={QueryJourney}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={QUERY_DURATION * 60}
    />
    <Composition
      id="QueryOpeningV2"
      component={QueryOpeningV2}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={V2_DURATION * 60}
    />
    <Composition
      id="QueryOpeningV3"
      component={QueryOpeningV3}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={V2_DURATION * 60}
    />
    <Composition
      id="QueryOpeningV4"
      component={QueryOpeningV4}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={V4_DURATION * 60}
    />
    <Composition
      id="QuerySearch"
      component={QuerySearch}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={SEARCH_DURATION * 60}
    />
    <Still
      id="InputBoxStyle"
      component={InputBoxStyle}
      width={1920}
      height={1080}
    />
    <Still
      id="01-Structure"
      component={StructureFrame}
      width={1920}
      height={1080}
    />
    <Still id="02-Entity" component={EntityFrame} width={1920} height={1080} />
    <Still id="03-Wiki" component={WikiFrame} width={1920} height={1080} />
  </>
);
